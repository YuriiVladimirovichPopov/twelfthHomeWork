import mongoose from "mongoose";
import { PostsMongoDb } from "../../types";
import { ObjectId, WithId } from "mongodb";
import { LikesInfoSchema } from "./reactionInfo.schema";
import { NewestLikeDetailsViewModel } from "../../models/reaction/reactionInfoViewModel";

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

export const NewestLikeDetailsForPostSchema = new mongoose.Schema<NewestLikeDetailsViewModel>({
  addedAt: {type: String, required: true},
  userId: {type:String, required: true},
  login: {type:String, required: true}
})
export const NewestLikeDetailsForPostModel = mongoose.model('NewestLikeDetailsViewModel', NewestLikeDetailsForPostSchema)


export const PostSchema = new mongoose.Schema<PostsMongoDb>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true,
    minLength: titleValid.minLength,
    maxLength: titleValid.maxLength,
  },
  shortDescription: { type: String, required: true,
    minLength: shortDescriptionValid.minLength,
    maxLength: shortDescriptionValid.maxLength,
  },
  content: { type: String, required: true,
    minLength: contentValid.minLength,
    maxLength: contentValid.maxLength,
  },
  blogId: { type: String, required: true },
  blogName: { type: String, required: true,
    minLength: blogNameValid.minLength,
    maxLength: blogNameValid.maxLength,
  },
  createdAt: { type: String, required: true },
  extendedLikesInfo: {
    likesInfo: { type: LikesInfoSchema, required: true },
    newestLikes: {type: [NewestLikeDetailsForPostSchema], defaultValue: []}
  }
});

export const PostModel = mongoose.model("posts", PostSchema);
