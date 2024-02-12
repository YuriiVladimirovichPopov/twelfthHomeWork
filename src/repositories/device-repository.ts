import "reflect-metadata";
import { DeviceMongoDbType } from "../types";
import { DeviceModel } from "../domain/schemas/device.schema";
import { injectable } from "inversify";

@injectable()
export class DeviceRepository {
  async findDeviceByUser(deviceId: string): Promise<DeviceMongoDbType | null> {
    try {
      const device = await DeviceModel.findOne({ deviceId });
      return device;
    } catch (error) {
      console.error("Error finding device by ID:", error);
      return null;
    }
  }

  async findValidDevice(deviceId: string): Promise<DeviceMongoDbType | null> {
    const device = await DeviceModel.findOne({ deviceId: deviceId });
    return device;
  }

  async getAllDevicesByUser(userId: string): Promise<DeviceMongoDbType[]> {
    try {
      const devices = await DeviceModel.find(
        { userId },
        { projection: { _id: 0, userId: 0 } },
      ).lean();
      return devices;
    } catch (error) {
      console.error("Error getting devices by userId:", error);
      return [];
    }
  }

  async deleteDeviceById(userId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await DeviceModel.deleteOne({ userId, deviceId });
      if (result.deletedCount === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async deleteAllDevicesExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    try {
      await DeviceModel.deleteMany({ userId, deviceId: { $ne: deviceId } });
      return true;
    } catch (error) {
      throw new Error("Failed to refresh tokens");
    }
  }

  async deleteAllDevices(): Promise<boolean> {
    try {
      const result = await DeviceModel.deleteMany({});
      return result.acknowledged === true;
    } catch (error) {
      return false;
    }
  }
}
