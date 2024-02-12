import "reflect-metadata";
import { Response, Request } from "express";
import { AuthService } from "../application/auth-service";
import { QueryUserRepository } from "../query repozitory/queryUserRepository";
import { DeviceRepository } from "../repositories/device-repository";
import { httpStatuses } from "../routers/helpers/send-status";
import { injectable } from "inversify";

@injectable()
export class SecurityController {
  constructor(
    protected queryUserRepository: QueryUserRepository,
    protected authService: AuthService,
    protected deviceRepository: DeviceRepository,
  ) {}

  async devices(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken; 
    if (!refreshToken) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Refresh token not found" });
    }

    const isValid = await this.authService.validateRefreshToken(refreshToken);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });
    }

    const user = await this.queryUserRepository.findUserById(isValid.userId);
    if (!user) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "User not found" });
    }

    const result = await this.deviceRepository.getAllDevicesByUser(
      isValid.userId,
    );
    if (!result) {
      res.status(httpStatuses.UNAUTHORIZED_401);
    } else {
      res.status(httpStatuses.OK_200).send(result);
    }
  }
  async deleteDevices(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const isValid = await this.authService.validateRefreshToken(refreshToken);
    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Unathorized" });
    }

    const result = await this.deviceRepository.deleteAllDevicesExceptCurrent(
      isValid.userId,
      isValid.deviceId,
    );
    if (result) {
      res
        .status(httpStatuses.NO_CONTENT_204)
        .send({ message: "Devices deleted" });
    } else {
      res
        .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
        .send({ message: "Server error" });
    }
  }
  async deleteDeviceById(req: Request, res: Response) {
    const refreshToken = req.cookies.refreshToken;
    const deviceId = req.params.deviceId;
    const isValid = await this.authService.validateRefreshToken(refreshToken);

    if (!isValid || !isValid.userId || !isValid.deviceId) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Unauthorized" });
    }

    const user = await this.queryUserRepository.findUserById(isValid.userId);
    if (!user) {
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "User not found" });
    }

    const device = await this.deviceRepository.findDeviceByUser(deviceId);
    if (!device) {
      return res
        .status(httpStatuses.NOT_FOUND_404)
        .send({ message: "Device not found" });
    }
    if (device.userId !== isValid.userId) {
      return res
        .status(httpStatuses.FORBIDDEN_403)
        .send({ message: "Device's ID is not valid" });
    }

    await this.deviceRepository.deleteDeviceById(user._id.toString(), deviceId); 
    return res
      .status(httpStatuses.NO_CONTENT_204)
      .send({ message: "Device's ID deleted " });
  }
}
