import { type Response } from "express";
import Analytics from "../models/Analytics.model.js";
import Quiz from "../models/Quiz.model.js";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const analyticsController = {
  // Get past run analytics for a specific quiz (Protected, creator only)
  async getQuizAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { quizId } = req.params;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      // Check quiz ownership
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      if (quiz.creatorId.toString() !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this quiz." });
      }

      const stats = await Analytics.find({ quizId } as any).sort({ endedAt: -1 });
      return res.json(stats);
    } catch (error: any) {
      console.error("GetQuizAnalytics Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Get overall summary metrics across all host's quizzes (Protected)
  async getOverallAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      // Fetch creator's quiz IDs
      const quizzes = await Quiz.find({ creatorId });
      const quizIds = quizzes.map((q) => q._id);

      // Find analytics matching any of the creator's quizzes
      const stats = await Analytics.find({ quizId: { $in: quizIds } } as any).sort({ endedAt: -1 });

      if (stats.length === 0) {
        return res.json({
          totalPlays: 0,
          avgParticipants: 0,
          quizzesStats: [],
        });
      }

      const totalPlays = stats.length;
      const totalPlayers = stats.reduce((acc, s) => acc + s.totalPlayers, 0);
      const avgParticipants = Math.round(totalPlayers / totalPlays);

      return res.json({
        totalPlays,
        avgParticipants,
        quizzesStats: stats,
      });
    } catch (error: any) {
      console.error("GetOverallAnalytics Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};
