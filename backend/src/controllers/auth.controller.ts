import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import redisClient from "../config/redis.js";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { queueMail } from "../workers/mail.worker.js";


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "default_access_secret_key_847291";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret_key_958102";

// Helper to sign tokens
function generateTokens(user: { id: string; username: string; email: string }) {
  const payload = { userId: user.id, username: user.username, email: user.email };
  
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required." });
      }

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({ error: "User with this email already exists." });
        }
        return res.status(400).json({ error: "Username is already taken." });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        email: email.toLowerCase(),
        passwordHash,
      });

      await newUser.save();

      const tokens = generateTokens({
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
      });

      return res.status(201).json({
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          email: newUser.email,
        },
        tokens,
      });
    } catch (error: any) {
      console.error("Register Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid email or password." });
      }

      const tokens = generateTokens({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      });

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        },
        tokens,
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required." });
      }

      // Check if token is blacklisted in Redis
      const isBlacklisted = await redisClient.get(`blacklist:${refreshToken}`);
      if (isBlacklisted) {
        return res.status(401).json({ error: "Token has been revoked. Please login again." });
      }

      try {
        const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
        
        // Generate new tokens
        const tokens = generateTokens({
          id: payload.userId,
          username: payload.username,
          email: payload.email,
        });

        // Optional: Blacklist old refresh token to prevent reuse (token rotation)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const secondsRemaining = payload.exp - currentTimestamp;
        if (secondsRemaining > 0) {
          await redisClient.setEx(`blacklist:${refreshToken}`, secondsRemaining, "true");
        }

        return res.json(tokens);
      } catch (err) {
        return res.status(401).json({ error: "Session expired or invalid refresh token." });
      }
    } catch (error: any) {
      console.error("Refresh Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        try {
          const payload = jwt.decode(refreshToken) as any;
          if (payload && payload.exp) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const secondsRemaining = payload.exp - currentTimestamp;
            if (secondsRemaining > 0) {
              // Blacklist in Redis
              await redisClient.setEx(`blacklist:${refreshToken}`, secondsRemaining, "true");
            }
          }
        } catch (err) {
          // Token decode failed or already expired, ignore
        }
      }
      return res.json({ message: "Successfully logged out." });
    } catch (error: any) {
      console.error("Logout Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      return res.json({ user });
    } catch (error: any) {
      console.error("GetMe Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<any> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No user registered with this email address." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setEx(`otp:password-reset:${email.toLowerCase()}`, 600, otp);

      const text = `Hello,\n\nYou requested a password reset. Your OTP is: ${otp}.\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`;
      const html = `<p>Hello,</p><p>You requested a password reset. Your OTP is: <strong>${otp}</strong>.</p><p>This OTP is valid for 10 minutes.</p><p>If you did not request this, please ignore this email.</p>`;
      
      await queueMail(email, "Password Reset OTP", text, html);

      return res.json({ message: "Password reset OTP has been sent to your email." });
    } catch (error: any) {
      console.error("ForgotPassword Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<any> {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No user registered with this email address." });
      }

      const cachedOtp = await redisClient.get(`otp:password-reset:${email.toLowerCase()}`);
      if (!cachedOtp || cachedOtp !== otp) {
        return res.status(400).json({ error: "Invalid or expired OTP." });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      user.passwordHash = passwordHash;
      await user.save();

      await redisClient.del(`otp:password-reset:${email.toLowerCase()}`);

      return res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error: any) {
      console.error("ResetPassword Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async forgotEmail(req: Request, res: Response): Promise<any> {
    try {
      const { username } = req.body;

      const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
      if (!user) {
        return res.status(404).json({ error: "No user found with this username." });
      }

      return res.json({ email: user.email });
    } catch (error: any) {
      console.error("ForgotEmail Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async forgotUsername(req: Request, res: Response): Promise<any> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ error: "No user registered with this email address." });
      }

      return res.json({ username: user.username });
    } catch (error: any) {
      console.error("ForgotUsername Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async sendOtp(req: Request, res: Response): Promise<any> {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({ error: "User with this email already exists." });
        }
        return res.status(400).json({ error: "Username is already taken." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.setEx(`otp:signup:${email.toLowerCase()}`, 300, otp);

      const text = `Hello,\n\nWelcome to Live Quiz! Your OTP to verify email for signup is: ${otp}.\nThis OTP is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`;
      const html = `<p>Hello,</p><p>Welcome to Live Quiz!</p><p>Your OTP to verify email for signup is: <strong>${otp}</strong>.</p><p>This OTP is valid for 5 minutes.</p><p>If you did not request this, please ignore this email.</p>`;

      await queueMail(email, "Verify your email for Live Quiz", text, html);

      return res.json({ message: "Verification OTP has been sent to your email." });
    } catch (error: any) {
      console.error("SendOtp Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async verifyOtpAndRegister(req: Request, res: Response): Promise<any> {
    try {
      const { username, email, password, otp } = req.body;

      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          return res.status(400).json({ error: "User with this email already exists." });
        }
        return res.status(400).json({ error: "Username is already taken." });
      }

      const cachedOtp = await redisClient.get(`otp:signup:${email.toLowerCase()}`);
      if (!cachedOtp || cachedOtp !== otp) {
        return res.status(400).json({ error: "Invalid or expired OTP." });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        email: email.toLowerCase(),
        passwordHash,
      });

      await newUser.save();
      await redisClient.del(`otp:signup:${email.toLowerCase()}`);

      const tokens = generateTokens({
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
      });

      return res.status(201).json({
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          email: newUser.email,
        },
        tokens,
      });
    } catch (error: any) {
      console.error("VerifyOtpAndRegister Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};
