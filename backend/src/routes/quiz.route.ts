import { Router } from "express";
import { quizController } from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createQuizSchema, updateQuizSchema, verifyAnswerSchema } from "../schemas/schemas.js";

const router = Router();

// Creator routes (protected)
router.get("/", authMiddleware as any, quizController.getQuizzes);
router.post("/", authMiddleware as any, validateBody(createQuizSchema) as any, quizController.createQuiz);
router.get("/:id", authMiddleware as any, quizController.getQuizById);
router.put("/:id", authMiddleware as any, validateBody(updateQuizSchema) as any, quizController.updateQuiz);
router.delete("/:id", authMiddleware as any, quizController.deleteQuiz);
router.post("/:id/publish", authMiddleware as any, quizController.publishQuiz);

// Participant route (public)
router.get("/join/:code", quizController.getQuizByJoinCode);
router.post("/join/:code/verify", validateBody(verifyAnswerSchema) as any, quizController.verifyAnswer);

export default router;

