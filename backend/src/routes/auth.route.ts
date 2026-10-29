import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  forgotEmailSchema,
  forgotUsernameSchema,
} from "../schemas/schemas.js";

const router = Router();

// Existing Auth Routes with Validation
router.post("/register", validateBody(registerSchema) as any, authController.register);
router.post("/login", validateBody(loginSchema) as any, authController.login);
router.post("/refresh", validateBody(refreshSchema) as any, authController.refresh);
router.post("/logout", validateBody(logoutSchema) as any, authController.logout);
router.get("/me", authMiddleware as any, authController.getMe);

// OTP-based Signup Routes
router.post("/signup/send-otp", validateBody(sendOtpSchema) as any, authController.sendOtp);
router.post("/signup/verify", validateBody(verifyOtpSchema) as any, authController.verifyOtpAndRegister);

// Forgot Credentials & Reset Password Routes
router.post("/forgot-password", validateBody(forgotPasswordSchema) as any, authController.forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema) as any, authController.resetPassword);
router.post("/forgot-email", validateBody(forgotEmailSchema) as any, authController.forgotEmail);
router.post("/forgot-username", validateBody(forgotUsernameSchema) as any, authController.forgotUsername);

export default router;