import mongoose, { HydratedDocument } from "mongoose";
import { CommentsMongoDbType } from "../../types";
import { commentatorInfoSchema } from "./commentatorInfo.schema";
import { LikesInfoSchema } from "./reactionInfo.schema";

export const contentValid = {
  minLength: 20,
  maxLength: 300,
};

export const CommentSchema = new mongoose.Schema<CommentsMongoDbType>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  postId: { type: String, required: true },
  content: {
    type: String,
    required: true,
    minLength: contentValid.minLength,
    maxLength: contentValid.maxLength,
  },
  commentatorInfo: { type: commentatorInfoSchema, required: true },
  createdAt: { type: String, required: true },
  likesInfo: { type: LikesInfoSchema, required: true },
});

export const CommentModel = mongoose.model("comments", CommentSchema);
