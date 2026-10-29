import { Router } from "express";
import authRouter from "./auth.route.js";
import quizRouter from "./quiz.route.js";
import sessionRouter from "./session.route.js";
import analyticsRouter from "./analytics.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/quizzes", quizRouter);
router.use("/sessions", sessionRouter);
router.use("/analytics", analyticsRouter);

export default router;
