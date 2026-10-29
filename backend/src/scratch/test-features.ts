import "dotenv/config";
import connectDB, { mongooseConnection } from "../config/db.js";
import redisClient from "../config/redis.js";
import User from "../models/User.model.js";
import { authController } from "../controllers/auth.controller.js";
import { processMailQueue } from "../workers/mail.worker.js";
import { type Request, type Response } from "express";

async function runTests() {
  try {
    console.log("Connecting to DB and Redis...");
    await connectDB();
    await redisClient.connect();
    console.log("Connected.");

    // Clean up previous test users
    console.log("Cleaning up test users...");
    await User.deleteMany({ email: { $in: ["testotp@example.com", "testforgot@example.com"] } });
    await redisClient.del([
      "otp:signup:testotp@example.com",
      "otp:password-reset:testotp@example.com",
      "mail:queue"
    ]);

    // Test 1: Send OTP for Signup
    console.log("\n--- TEST 1: Send OTP for Signup ---");
    let reqSendOtp = {
      body: {
        username: "testotp",
        email: "testotp@example.com",
        password: "password123"
      }
    } as unknown as Request;

    let resSendOtp = {
      status(code: number) {
        console.log(`[Response Status] ${code}`);
        return this;
      },
      json(data: any) {
        console.log("[Response JSON]", data);
        return this;
      }
    } as unknown as Response;

    await authController.sendOtp(reqSendOtp, resSendOtp);

    // Verify OTP stored in Redis
    const cachedOtp = await redisClient.get("otp:signup:testotp@example.com");
    console.log(`[Redis OTP Value] ${cachedOtp}`);

    // Verify Mail Queue has the email job
    console.log("\n--- Processing Mail Queue to see if OTP mail was queued ---");
    await processMailQueue();

    // Test 2: Verify OTP and Register
    console.log("\n--- TEST 2: Verify OTP and Register (with valid OTP) ---");
    let reqVerifyOtp = {
      body: {
        username: "testotp",
        email: "testotp@example.com",
        password: "password123",
        otp: cachedOtp
      }
    } as unknown as Request;

    await authController.verifyOtpAndRegister(reqVerifyOtp, resSendOtp);

    // Verify user is in MongoDB
    const registeredUser = await User.findOne({ email: "testotp@example.com" });
    console.log(`[MongoDB User Found]`, registeredUser ? { id: registeredUser._id, username: registeredUser.username, email: registeredUser.email } : "Not Found");

    // Test 3: Forgot Email (find by username)
    console.log("\n--- TEST 3: Forgot Email (find by username) ---");
    let reqForgotEmail = {
      body: { username: "testotp" }
    } as unknown as Request;
    await authController.forgotEmail(reqForgotEmail, resSendOtp);

    // Test 4: Forgot Username (find by email)
    console.log("\n--- TEST 4: Forgot Username (find by email) ---");
    let reqForgotUsername = {
      body: { email: "testotp@example.com" }
    } as unknown as Request;
    await authController.forgotUsername(reqForgotUsername, resSendOtp);

    // Test 5: Forgot Password OTP
    console.log("\n--- TEST 5: Forgot Password OTP ---");
    let reqForgotPassword = {
      body: { email: "testotp@example.com" }
    } as unknown as Request;
    await authController.forgotPassword(reqForgotPassword, resSendOtp);

    // Verify Reset OTP stored in Redis
    const resetOtp = await redisClient.get("otp:password-reset:testotp@example.com");
    console.log(`[Redis Reset OTP Value] ${resetOtp}`);

    // Verify Mail Queue has the reset email job
    console.log("\n--- Processing Mail Queue to see if Reset Password mail was queued ---");
    await processMailQueue();

    // Test 6: Reset Password
    console.log("\n--- TEST 6: Reset Password (with valid OTP) ---");
    let reqResetPassword = {
      body: {
        email: "testotp@example.com",
        otp: resetOtp,
        newPassword: "newpassword456"
      }
    } as unknown as Request;
    await authController.resetPassword(reqResetPassword, resSendOtp);

    // Verify password is changed (can authenticate with new password using login controller logic)
    console.log("\n--- TEST 7: Login with new password ---");
    let reqLogin = {
      body: {
        email: "testotp@example.com",
        password: "newpassword456"
      }
    } as unknown as Request;
    await authController.login(reqLogin, resSendOtp);

    console.log("\nAll tests completed.");
  } catch (error) {
    console.error("Test error:", error);
  } finally {
    console.log("Disconnecting...");
    await redisClient.quit();
    await mongooseConnection?.disconnect();
    console.log("Disconnected.");
  }
}

runTests();
