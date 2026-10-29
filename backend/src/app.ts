import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import mainRouter from "./routes/main.route..js";

const app: Express = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  return res.json({
    message: "Server is running",
  });
});

app.use("/api/v1", mainRouter);

export default app;
