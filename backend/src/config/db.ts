import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://livequizuser:livequiz123@localhost:27017/livequiz?authSource=livequiz";

let mongooseConnection: any;

const connectDB = async () => {
  try {
    mongooseConnection = await mongoose.connect(MONGO_URI);
  } catch (error : any) {
    throw new Error(`Failed to connect to MongoDB: ${error}`);
  }
};

export {mongooseConnection};
export default connectDB;