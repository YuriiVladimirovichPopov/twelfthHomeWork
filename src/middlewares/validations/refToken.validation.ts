import "reflect-metadata";

import { NextFunction, Request, Response } from "express";
import { httpStatuses } from "../../routers/helpers/send-status";
import { jwtService } from "../../application/jwt-service";
import {
  AuthService,
  container,
  DeviceRepository,
  QueryUserRepository,
} from "../../composition-root";

const authService = container.resolve<AuthService>(AuthService);
const deviceRepository = container.resolve<DeviceRepository>(DeviceRepository);
const queryUserRepository =
  container.resolve<QueryUserRepository>(QueryUserRepository);

export const refTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Refresh token not found" });

    const isValid = await authService.validateRefreshToken(refreshToken);
    if (!isValid)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token" });

    const user = await queryUserRepository.findUserById(isValid.userId);
    if (!user)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "User not found", isValid: isValid });

    const device = await deviceRepository.findDeviceByUser(isValid.deviceId);
    if (!device)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "No device" });

    const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
    if (lastActiveDate !== device.lastActiveDate)
      return res
        .status(httpStatuses.UNAUTHORIZED_401)
        .send({ message: "Invalid refresh token version" });
    req.userId = user._id.toString();
    req.deviceId = device.deviceId;
    next();
  } catch (err) {
    console.log("как - то, что - то не то е! " + err);
    return res.sendStatus(httpStatuses.INTERNAL_SERVER_ERROR_500);
  }
};
