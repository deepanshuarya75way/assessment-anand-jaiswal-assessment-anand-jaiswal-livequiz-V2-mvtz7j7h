import mongoose, { Schema, type Document } from "mongoose";

export interface IQuestionStat {
  questionText: string;
  correctPercentage: number;
  totalAnswers: number;
}

export interface IAnalytics extends Document {
  quizId: mongoose.Types.ObjectId;
  quizTitle: string;
  sessionCode: string;
  totalPlayers: number;
  averageScore: number;
  questionStats: IQuestionStat[];
  endedAt: Date;
}

const QuestionStatSchema: Schema = new Schema({
  questionText: { type: String, required: true },
  correctPercentage: { type: Number, required: true },
  totalAnswers: { type: Number, required: true },
});

const AnalyticsSchema: Schema = new Schema({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    index: true,
  },
  quizTitle: {
    type: String,
    required: true,
  },
  sessionCode: {
    type: String,
    required: true,
    index: true,
  },
  totalPlayers: {
    type: Number,
    required: true,
  },
  averageScore: {
    type: Number,
    required: true,
  },
  questionStats: [QuestionStatSchema],
  endedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);
