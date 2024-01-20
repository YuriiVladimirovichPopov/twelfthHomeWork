import mongoose from "mongoose";
import { BlogsMongoDbType } from "../../types";
import { ObjectId, WithId } from "mongodb";

export const nameValid = {
  minLength: 1,
  maxLength: 15,
};
export const descriptionValid = {
  minLength: 1,
  maxLength: 500,
};

export const BlogSchema = new mongoose.Schema<BlogsMongoDbType>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: {
    type: String,
    required: true,
    minLength: nameValid.minLength,
    maxLength: nameValid.maxLength,
  },
  description: {
    type: String,
    required: true,
    minLength: descriptionValid.minLength,
    maxLength: descriptionValid.maxLength,
  },
  websiteUrl: { type: String, required: true },
  createdAt: { type: String, required: true },
  isMembership: { type: Boolean, required: true },
});

export const BlogModel = mongoose.model("blogs", BlogSchema);
