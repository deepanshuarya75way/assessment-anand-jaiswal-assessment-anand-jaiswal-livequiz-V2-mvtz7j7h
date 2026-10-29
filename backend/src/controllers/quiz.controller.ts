import { type Request, type Response } from "express";
import Quiz from "../models/Quiz.model.js";
import redisClient from "../config/redis.js";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const quizController = {
  // Get all quizzes created by the logged-in user
  async getQuizzes(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const quizzes = await Quiz.find({ creatorId }).sort({ createdAt: -1 });
      return res.json(quizzes);
    } catch (error: any) {
      console.error("GetQuizzes Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Get full quiz details (Protected, creator only)
  async getQuizById(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { id } = req.params;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      if (quiz.creatorId.toString() !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this quiz." });
      }

      return res.json(quiz);
    } catch (error: any) {
      console.error("GetQuizById Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Create a new quiz
  async createQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { title, description, questions } = req.body;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      if (!title) {
        return res.status(400).json({ error: "Quiz title is required." });
      }

      const newQuiz = new Quiz({
        title,
        description: description || "",
        creatorId,
        questions: questions || [],
      });

      await newQuiz.save();
      return res.status(201).json(newQuiz);
    } catch (error: any) {
      console.error("CreateQuiz Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Update a quiz
  async updateQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { id } = req.params;
      const { title, description, questions, isPublished, joinCode } = req.body;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      if (quiz.creatorId.toString() !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this quiz." });
      }

      quiz.title = title ?? quiz.title;
      quiz.description = description ?? quiz.description;
      quiz.questions = questions ?? quiz.questions;
      quiz.isPublished = isPublished ?? quiz.isPublished;
      quiz.joinCode = joinCode ?? quiz.joinCode;

      await quiz.save();
      return res.json(quiz);
    } catch (error: any) {
      console.error("UpdateQuiz Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Delete a quiz
  async deleteQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { id } = req.params;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      if (quiz.creatorId.toString() !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this quiz." });
      }

      await Quiz.findByIdAndDelete(id);
      return res.json({ message: "Quiz deleted successfully." });
    } catch (error: any) {
      console.error("DeleteQuiz Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Publish a quiz & generate a 6-digit Join Code
  async publishQuiz(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { id } = req.params;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const quiz = await Quiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      if (quiz.creatorId.toString() !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this quiz." });
      }

      // Generate a unique 6-digit code
      let code = "";
      let codeExists = true;
      
      while (codeExists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await Quiz.findOne({ joinCode: code } as any);
        if (!existing) {
          codeExists = false;
        }
      }

      quiz.isPublished = true;
      quiz.joinCode = code;
      await quiz.save();

      // Initialize live session inside Redis
      await redisClient.hSet(`session:${code}`, {
        quizId: quiz._id.toString(),
        quizTitle: quiz.title,
        creatorId: creatorId,
        isActive: "true",
        currentQuestionIndex: "-1",
        status: "waiting",
      });

      // Emit session created event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "SESSION_CREATED",
          code,
        });
      }

      return res.json({ code });
    } catch (error: any) {
      console.error("PublishQuiz Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // PUBLIC ENDPOINT: Get quiz questions for a player joining by Code
  // Strips correctOptionIndex for anti-cheating security
  async getQuizByJoinCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const quiz = await Quiz.findOne({ joinCode: code, isPublished: true } as any);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz session not found or inactive." });
      }

      // Strip correct answers
      const safeQuestions = quiz.questions.map((q) => ({
        id: (q as any)._id || Math.random().toString(),
        text: q.text,
        options: q.options,
        timeLimit: q.timeLimit,
        pointsWeight: q.pointsWeight,
      }));

      return res.json({
        id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: safeQuestions,
        createdAt: quiz.createdAt,
        isPublished: quiz.isPublished,
        joinCode: quiz.joinCode,
      });
    } catch (error: any) {
      console.error("GetQuizByJoinCode Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  async verifyAnswer(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const { questionIndex, selectedOptionIndex } = req.body;

      if (questionIndex === undefined || selectedOptionIndex === undefined) {
        return res.status(400).json({ error: "questionIndex and selectedOptionIndex are required." });
      }

      const quiz = await Quiz.findOne({ joinCode: code, isPublished: true } as any);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz session not found or inactive." });
      }

      const question = quiz.questions[questionIndex];
      if (!question) {
        return res.status(400).json({ error: "Question index out of bounds." });
      }

      const isCorrect = question.correctOptionIndex === selectedOptionIndex;

      return res.json({
        isCorrect,
        correctOptionIndex: question.correctOptionIndex,
      });
    } catch (error: any) {
      console.error("VerifyAnswer Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};
