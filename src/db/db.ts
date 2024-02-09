import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

import { MongoClient } from "mongodb";
import { AuthSchema } from "../domain/schemas/auth.schema";

const dbName = "12_home_work";
const url = process.env.mongoUrl || `mongodb://0.0.0.0:27017`;

console.log(url);
if (!url) {
  throw new Error("Url is not exsist");
}

export const client = new MongoClient(url);

export const TokenModel = mongoose.model("token", AuthSchema);

export const runDb = async () => {
  try {
    await mongoose.connect(url);
    console.log("connected successfully to database");
  } catch (err) {
    console.log("error connecting");
    await mongoose.disconnect();
  }
};
