import { z } from "zod";

// Base rules
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores");

const emailSchema = z.string()
  .email("Invalid email address")
  .transform((val) => val.toLowerCase().trim());

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters");

const otpSchema = z.string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must only contain digits");

// Auth Schemas
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const sendOtpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  otp: otpSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema,
});

export const forgotEmailSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
});

export const forgotUsernameSchema = z.object({
  email: emailSchema,
});

// Quiz Question Schema
export const questionSchema = z.object({
  text: z.string().min(1, "Question text is required").trim(),
  options: z.array(z.string().min(1, "Option text cannot be empty")).min(2, "Question must have at least 2 options"),
  correctOptionIndex: z.number().int().nonnegative("Correct option index must be non-negative"),
  timeLimit: z.number().int().positive("Time limit must be positive").default(20),
  pointsWeight: z.number().positive("Points weight must be positive").default(1),
});

// Quiz Schemas
export const createQuizSchema = z.object({
  title: z.string().min(1, "Quiz title is required").max(100, "Quiz title cannot exceed 100 characters").trim(),
  description: z.string().default("").transform(val => val.trim()),
  questions: z.array(questionSchema).default([]),
});

export const updateQuizSchema = z.object({
  title: z.string().min(1, "Quiz title cannot be empty").max(100, "Quiz title cannot exceed 100 characters").trim().optional(),
  description: z.string().trim().optional(),
  questions: z.array(questionSchema).optional(),
  isPublished: z.boolean().optional(),
  joinCode: z.string().optional(),
});

export const verifyAnswerSchema = z.object({
  questionIndex: z.number().int().nonnegative("Question index must be non-negative"),
  selectedOptionIndex: z.number().int().nonnegative("Selected option index must be non-negative"),
});

// Session Schemas
export const joinSessionSchema = z.object({
  nickname: z.string().min(1, "Nickname is required").max(20, "Nickname cannot exceed 20 characters").trim(),
});

export const submitAnswerSchema = z.object({
  playerId: z.string().min(1, "Player ID is required").trim(),
  questionIndex: z.number().int().nonnegative("Question index must be non-negative"),
  selectedOptionIndex: z.number().int().nonnegative("Selected option index must be non-negative"),
  timeRemainingMs: z.number().int().nonnegative("Time remaining must be non-negative"),
});
