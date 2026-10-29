import "dotenv/config";
import app from "./app.js";
import redisClient from "./config/redis.js";
import connectDB, {mongooseConnection} from "./config/db.js";
import { startAnalyticsWorker, stopAnalyticsWorker } from "./workers/analytics.worker.js";
import { startMailWorker, stopMailWorker } from "./workers/mail.worker.js";
import { createServer } from "http";
import { Server } from "socket.io";




const PORT = process.env.PORT || 3000;

let server: any;

async function bootstrap() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    await redisClient.connect();
    console.log("Connected to Redis");
    
    // Start background analytics and mail queue workers
    startAnalyticsWorker();
    startMailWorker();

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on("joinRoom", (code: string) => {
        socket.join(`session:${code}`);
        console.log(`[Socket] Client ${socket.id} joined room session:${code}`);
      });

      socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    server = httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error: any) {
    console.error("Failed to start server:", error);
  }
}

bootstrap();

function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  console.log("Shutting down gracefully...");

  server.close(async () => {
    try {
      stopAnalyticsWorker();
      stopMailWorker();
      await redisClient.quit();
      await mongooseConnection?.disconnect();
      process.exit(0);
    } catch (error) {
      console.error("Error closing server:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGQUIT", gracefulShutdown);
