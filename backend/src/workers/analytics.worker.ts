import redisClient from "../config/redis.js";
import Quiz from "../models/Quiz.model.js";
import Analytics from "../models/Analytics.model.js";

// Helper to fetch player profiles from Redis and parse them
async function getRedisPlayers(code: string): Promise<any[]> {
  const playersHash = await redisClient.hGetAll(`players:${code}`);
  const players: any[] = [];
  
  for (const [playerId, playerStr] of Object.entries(playersHash)) {
    const player = JSON.parse(playerStr);
    const score = await redisClient.zScore(`leaderboard:${code}`, playerId);
    player.score = score !== null ? score : 0;
    players.push(player);
  }
  
  return players;
}

export async function processAnalyticsQueue() {
  try {
    // Pop a session code from the queue
    const code = await redisClient.rPop("quiz:analytics:queue");
    if (!code) return; // Queue is empty, return silently

    console.log(`[Queue Worker] Processing analytics migration for session: ${code}`);

    // Fetch session details from Redis
    const sessionData = await redisClient.hGetAll(`session:${code}`);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      console.warn(`[Queue Worker] Session data not found in Redis for code: ${code}. Aborting.`);
      return;
    }

    const quizId = sessionData.quizId;
    const quizTitle = sessionData.quizTitle;
    const players = await getRedisPlayers(code);
    const totalPlayers = players.length;

    if (totalPlayers === 0) {
      console.log(`[Queue Worker] No players participated in session ${code}. Deleting Redis session.`);
      await cleanupRedisKeys(code);
      return;
    }

    // Fetch full quiz details from MongoDB
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.error(`[Queue Worker] Quiz ${quizId} not found in MongoDB for session ${code}. Cannot generate analytics.`);
      return;
    }

    // Calculate aggregated stats
    const averageScore = Math.round(players.reduce((acc, p) => acc + p.score, 0) / totalPlayers);

    // Calculate correctness per question
    const questionStats = quiz.questions.map((q, qIdx) => {
      let correctAnswers = 0;
      let totalAnswers = 0;
      
      players.forEach((p) => {
        const answer = p.answers.find((a: any) => a.questionIndex === qIdx);
        if (answer) {
          totalAnswers++;
          if (answer.isCorrect) correctAnswers++;
        }
      });
      
      return {
        questionText: q.text,
        correctPercentage: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
        totalAnswers,
      };
    });

    // Create Mongoose Analytics document
    const newAnalytics = new Analytics({
      quizId,
      quizTitle,
      sessionCode: code,
      totalPlayers,
      averageScore,
      questionStats,
      endedAt: new Date(),
    });

    await newAnalytics.save();
    console.log(`[Queue Worker] Analytics migrated successfully to MongoDB for session ${code}`);

    // Cleanup Redis keys
    await cleanupRedisKeys(code);
  } catch (error) {
    console.error("[Queue Worker] Error processing analytics queue:", error);
  }
}

async function cleanupRedisKeys(code: string) {
  try {
    await redisClient.del([
      `session:${code}`,
      `players:${code}`,
      `leaderboard:${code}`,
    ]);
    console.log(`[Queue Worker] Redis keys deleted for session ${code}`);
  } catch (err) {
    console.error(`[Queue Worker] Failed to clean up Redis keys for session ${code}:`, err);
  }
}

// Start polling loop
let intervalId: NodeJS.Timeout | null = null;

export function startAnalyticsWorker(pollIntervalMs = 1500) {
  if (intervalId) return;
  console.log(`[Queue Worker] Analytics queue processor started (polling every ${pollIntervalMs}ms)`);
  
  intervalId = setInterval(async () => {
    await processAnalyticsQueue();
  }, pollIntervalMs);
}

export function stopAnalyticsWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Queue Worker] Analytics queue processor stopped.");
  }
}
