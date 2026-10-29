import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/quiz/:quizId", authMiddleware as any, analyticsController.getQuizAnalytics);
router.get("/overall", authMiddleware as any, analyticsController.getOverallAnalytics);

export default router;
