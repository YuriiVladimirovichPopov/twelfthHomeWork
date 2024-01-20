import mongoose from "mongoose";
import { DeviceMongoDbType } from "../../types";
import { ObjectId, WithId } from "mongodb";

export const DeviceSchema = new mongoose.Schema<DeviceMongoDbType>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  ip: { type: String, required: true },
  title: { type: String, required: true },
  lastActiveDate: { type: String, required: true },
  deviceId: { type: String, required: true },
  userId: { type: String, required: true },
});

export const DeviceModel = mongoose.model("device", DeviceSchema);
