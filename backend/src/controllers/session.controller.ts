import { type Request, type Response } from "express";
import redisClient from "../config/redis.js";
import Quiz from "../models/Quiz.model.js";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware.js";

// Helper to get session from Redis and parse it
async function getRedisSession(code: string): Promise<any | null> {
  const data = await redisClient.hGetAll(`session:${code}`);
  if (!data || Object.keys(data).length === 0) return null;
  
  return {
    code,
    quizId: data.quizId,
    quizTitle: data.quizTitle,
    creatorId: data.creatorId,
    isActive: data.isActive === "true",
    currentQuestionIndex: parseInt(data.currentQuestionIndex || "-1", 10),
    status: data.status,
    startedAt: data.startedAt || undefined,
  };
}

// Helper to get players from Redis and parse them with scores
async function getRedisPlayers(code: string): Promise<{ [playerId: string]: any }> {
  const playersHash = await redisClient.hGetAll(`players:${code}`);
  const players: { [playerId: string]: any } = {};
  
  for (const [playerId, playerStr] of Object.entries(playersHash)) {
    const player = JSON.parse(playerStr);
    // Get score from ZSET
    const score = await redisClient.zScore(`leaderboard:${code}`, playerId);
    player.score = score !== null ? score : 0;
    players[playerId] = player;
  }
  
  return players;
}

export const sessionController = {
  // Get active session status and players leaderboard (ZSET rank)
  async getSession(req: Request, res: Response) {
    try {
      const { code } = req.params as any;
      
      const session = await getRedisSession(code);
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }
      
      const players = await getRedisPlayers(code);
      session.players = players;
      
      return res.json(session);
    } catch (error: any) {
      console.error("GetSession Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Join a live session
  async joinSession(req: Request, res: Response) {
    try {
      const { code } = req.params as any;
      const { nickname } = req.body;

      if (!nickname) {
        return res.status(400).json({ error: "Nickname is required." });
      }

      const session = await getRedisSession(code);
      if (!session || !session.isActive) {
        return res.status(404).json({ error: "Active quiz session not found." });
      }

      // Check if nickname is taken
      const players = await getRedisPlayers(code);
      if (Object.values(players).some((p: any) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
        return res.status(400).json({ error: "Nickname is already taken in this quiz." });
      }

      const playerId = "player_" + Math.random().toString(36).substring(2, 11);
      const newPlayer = {
        id: playerId,
        nickname,
        joinedAt: new Date().toISOString(),
        score: 0,
        answers: [],
      };

      // Save player profile in hash
      await redisClient.hSet(`players:${code}`, playerId, JSON.stringify(newPlayer));
      
      // Add player to leaderboard ZSET with score 0
      await redisClient.zAdd(`leaderboard:${code}`, { score: 0, value: playerId });

      // Fetch safe questions list from MongoDB
      const quiz = await Quiz.findById(session.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz questions not found." });
      }

      const safeQuestions = quiz.questions.map((q) => ({
        id: (q as any)._id || Math.random().toString(),
        text: q.text,
        options: q.options,
        timeLimit: q.timeLimit,
        pointsWeight: q.pointsWeight,
      }));

      const safeQuiz = {
        id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        questions: safeQuestions,
        createdAt: quiz.createdAt,
        isPublished: quiz.isPublished,
        joinCode: quiz.joinCode,
      };

      // Retrieve updated session to return
      const updatedSession = await getRedisSession(code);
      const updatedPlayers = await getRedisPlayers(code);
      updatedSession.players = updatedPlayers;

      // Emit player joined event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "PLAYER_JOINED",
          code,
          playerId,
          nickname,
          score: 0,
        });
      }

      return res.json({
        playerId,
        session: updatedSession,
        quiz: safeQuiz,
      });
    } catch (error: any) {
      console.error("JoinSession Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Submit answer, calculate score, increment ZSET leaderboard
  async submitAnswer(req: Request, res: Response) {
    try {
      const { code } = req.params as any;
      const { playerId, questionIndex, selectedOptionIndex, timeRemainingMs } = req.body;

      if (playerId === undefined || questionIndex === undefined || selectedOptionIndex === undefined || timeRemainingMs === undefined) {
        return res.status(400).json({ error: "playerId, questionIndex, selectedOptionIndex, and timeRemainingMs are required." });
      }

      const session = await getRedisSession(code);
      if (!session || !session.isActive) {
        return res.status(404).json({ error: "Active session not found." });
      }

      const playerStr = await redisClient.hGet(`players:${code}`, playerId);
      if (!playerStr) {
        return res.status(404).json({ error: "Player not found in this session." });
      }

      const player = JSON.parse(playerStr);

      // Prevent duplicate answers
      if (player.answers.some((a: any) => a.questionIndex === questionIndex)) {
        const existing = player.answers.find((a: any) => a.questionIndex === questionIndex);
        const score = await redisClient.zScore(`leaderboard:${code}`, playerId);
        return res.json({
          isCorrect: existing.isCorrect,
          pointsScored: existing.pointsScored,
          totalScore: score !== null ? score : 0,
        });
      }

      // Fetch correct answers from MongoDB
      const quiz = await Quiz.findById(session.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      const question = quiz.questions[questionIndex];
      if (!question) {
        return res.status(400).json({ error: "Question index out of bounds." });
      }

      const isCorrect = question.correctOptionIndex === selectedOptionIndex;
      let pointsScored = 0;

      const totalTimeMs = question.timeLimit * 1000;
      const timeTaken = (totalTimeMs - timeRemainingMs) / 1000;

      if (isCorrect) {
        const baseScore = 1000 * question.pointsWeight;
        const speedRatio = Math.max(0, Math.min(1, timeRemainingMs / totalTimeMs));
        pointsScored = Math.round(baseScore * (0.5 + 0.5 * speedRatio));
      }

      // Update player profile
      player.answers.push({
        questionIndex,
        selectedOptionIndex,
        isCorrect,
        pointsScored,
        timeTaken,
      });

      // Increment score in Redis ZSET
      const newScore = await redisClient.zIncrBy(`leaderboard:${code}`, pointsScored, playerId);
      
      player.score = newScore;
      await redisClient.hSet(`players:${code}`, playerId, JSON.stringify(player));

      // Emit answer submitted event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "ANSWER_SUBMITTED",
          code,
          playerId,
          questionIndex,
          pointsScored,
          isCorrect,
        });
      }

      return res.json({
        isCorrect,
        pointsScored,
        totalScore: newScore,
      });
    } catch (error: any) {
      console.error("SubmitAnswer Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Host controller: advance to next question
  async nextQuestion(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { code } = req.params as any;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const session = await getRedisSession(code);
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }

      if (session.creatorId !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this session." });
      }

      const quiz = await Quiz.findById(session.quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz details not found." });
      }

      let updatedIndex = session.currentQuestionIndex;
      let status = session.status;
      let isActive = session.isActive;

      if (updatedIndex === -1) {
        status = "active";
      }

      updatedIndex += 1;

      if (updatedIndex >= quiz.questions.length) {
        status = "completed";
        isActive = false;
        // Push session code to analytics background migration queue
        await redisClient.lPush("quiz:analytics:queue", code);
      }

      const sessionUpdates: any = {
        currentQuestionIndex: updatedIndex.toString(),
        status,
        isActive: isActive.toString(),
      };

      if (session.currentQuestionIndex === -1) {
        sessionUpdates.startedAt = new Date().toISOString();
      }

      await redisClient.hSet(`session:${code}`, sessionUpdates);

      const latestSession = await getRedisSession(code);
      const players = await getRedisPlayers(code);
      latestSession.players = players;

      // Emit question changed event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "QUESTION_CHANGED",
          code,
          currentQuestionIndex: latestSession.currentQuestionIndex,
          status: latestSession.status,
        });
      }

      return res.json(latestSession);
    } catch (error: any) {
      console.error("NextQuestion Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Host controller: force end session
  async endSession(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { code } = req.params as any;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const session = await getRedisSession(code);
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }

      if (session.creatorId !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this session." });
      }

      await redisClient.hSet(`session:${code}`, {
        status: "completed",
        isActive: "false",
      });

      // Push session code to analytics background migration queue
      await redisClient.lPush("quiz:analytics:queue", code);

      const latestSession = await getRedisSession(code);
      const players = await getRedisPlayers(code);
      latestSession.players = players;

      // Emit session ended event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "SESSION_ENDED",
          code,
        });
      }

      return res.json(latestSession);
    } catch (error: any) {
      console.error("EndSession Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  // Host controller: abandon/destroy session without saving analytics
  async abandonSession(req: AuthenticatedRequest, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { code } = req.params as any;

      if (!creatorId) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const session = await getRedisSession(code);
      if (!session) {
        return res.status(404).json({ error: "Session not found." });
      }

      if (session.creatorId !== creatorId) {
        return res.status(403).json({ error: "Access denied. You do not own this session." });
      }

      // Reset the quiz document in MongoDB
      await Quiz.updateOne(
        { joinCode: code } as any,
        { $set: { isPublished: false, joinCode: null } } as any
      );

      // Delete the Redis keys associated with this active session immediately
      await redisClient.del(`session:${code}`);
      await redisClient.del(`players:${code}`);
      await redisClient.del(`leaderboard:${code}`);

      // Emit session abandoned event via WebSocket
      const io = req.app.get("io");
      if (io) {
        io.to(`session:${code}`).emit("session_event", {
          type: "SESSION_ENDED",
          code,
          abandoned: true,
        });
      }

      return res.json({ success: true, message: "Session successfully destroyed." });
    } catch (error: any) {
      console.error("AbandonSession Error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
};
