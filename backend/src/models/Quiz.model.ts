import mongoose, { Schema, type Document } from "mongoose";

export interface IQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number;
  pointsWeight: number;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  creatorId: mongoose.Types.ObjectId;
  questions: IQuestion[];
  isPublished: boolean;
  joinCode?: string;
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [
      (val: string[]) => val.length >= 2,
      "Question must have at least 2 options.",
    ],
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
  },
  timeLimit: {
    type: Number,
    required: true,
    default: 20, // default 20 seconds
  },
  pointsWeight: {
    type: Number,
    required: true,
    default: 1, // standard 1x
  },
});

const QuizSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  questions: [QuestionSchema],
  isPublished: {
    type: Boolean,
    default: false,
  },
  joinCode: {
    type: String,
    index: true,
    unique: true,
    sparse: true, // Only enforces uniqueness for non-null/non-existent keys
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
