import mongoose from "mongoose";
import { PostsMongoDb } from "../../types";
import { ReactionStatusEnum } from "./reactionInfo.schema";
import {
  ExtendedReactionInfoViewModelForPost,
  NewestLikeDetailsViewModel,
} from "../../models/reaction/reactionInfoViewModel";

export const titleValid = {
  minLength: 1,
  maxLength: 30,
};

export const shortDescriptionValid = {
  minLength: 1,
  maxLength: 100,
};

export const contentValid = {
  minLength: 1,
  maxLength: 1000,
};

export const blogNameValid = {
  minLength: 1,
  maxLength: 15,
};

const NewestLikeDetailsForPostSchema =
  new mongoose.Schema<NewestLikeDetailsViewModel>(
    {
      addedAt: { type: String, required: true },
      userId: { type: String, required: true },
      login: { type: String, required: true },
    },
    { _id: false },
  );
export const NewestLikeDetailsForPostModel = mongoose.model(
  "NewestLikeDetailsViewModel",
  NewestLikeDetailsForPostSchema,
);

export const ExtendedReactionForPostSchema =
  new mongoose.Schema<ExtendedReactionInfoViewModelForPost>({
    likesCount: { type: Number, required: true },
    dislikesCount: { type: Number, required: true },
    newestLikes: [{ type: NewestLikeDetailsForPostSchema, required: true }],
  });
export const ExtendedReactionForPostModel = mongoose.model(
  "ExtendedReactionForPostModel",
  ExtendedReactionForPostSchema,
);

export const PostSchema = new mongoose.Schema<PostsMongoDb>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: {
    type: String,
    required: true,
    minLength: titleValid.minLength,
    maxLength: titleValid.maxLength,
  },
  shortDescription: {
    type: String,
    required: true,
    minLength: shortDescriptionValid.minLength,
    maxLength: shortDescriptionValid.maxLength,
  },
  content: {
    type: String,
    required: true,
    minLength: contentValid.minLength,
    maxLength: contentValid.maxLength,
  },
  blogId: { type: String, required: true },
  blogName: {
    type: String,
    required: true,
    minLength: blogNameValid.minLength,
    maxLength: blogNameValid.maxLength,
  },
  createdAt: { type: String, required: true },
  extendedLikesInfo: { type: ExtendedReactionForPostSchema, required: true },
});

export const PostModel = mongoose.model("posts", PostSchema);
