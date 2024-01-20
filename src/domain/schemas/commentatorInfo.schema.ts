import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export const commentatorInfoSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, required: true },
    userLogin: { type: String, required: true },
  },
  { _id: false },
);
