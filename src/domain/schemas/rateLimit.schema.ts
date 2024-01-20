import mongoose from "mongoose";
import { RateLimitMongoDbType } from "../../types";

export const RateLimitSchema = new mongoose.Schema<RateLimitMongoDbType>({
  IP: { type: String, required: true },
  URL: { type: String, required: true },
  date: { type: Date, required: true },
});

export const RateLimitModel = mongoose.model("rateLimit", RateLimitSchema);
