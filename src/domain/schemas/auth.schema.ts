import mongoose from "mongoose";
import { AuthViewModel } from "../../models/auth";

export const AuthSchema = new mongoose.Schema<AuthViewModel>({
  email: { type: String, required: true },
  login: { type: String, required: true },
  userId: { type: String, required: true },
});

export const AuthModel = mongoose.model("auth", AuthSchema);
