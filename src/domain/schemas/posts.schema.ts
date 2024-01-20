import mongoose from "mongoose";
import { PostsMongoDbType } from "../../types";
import { ObjectId, WithId } from "mongodb";

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

export const PostSchema = new mongoose.Schema<PostsMongoDbType>({
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
});

export const PostModel = mongoose.model("posts", PostSchema);
