import { Router } from "express";
import { sessionController } from "../controllers/session.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { joinSessionSchema, submitAnswerSchema } from "../schemas/schemas.js";

const router = Router();

// Public routes for participants
router.get("/:code", sessionController.getSession);
router.post("/:code/join", validateBody(joinSessionSchema) as any, sessionController.joinSession);
router.post("/:code/submit", validateBody(submitAnswerSchema) as any, sessionController.submitAnswer);

// Host routes (protected)
router.post("/:code/next", authMiddleware as any, sessionController.nextQuestion);
router.post("/:code/end", authMiddleware as any, sessionController.endSession);
router.post("/:code/abandon", authMiddleware as any, sessionController.abandonSession);

export default router;

