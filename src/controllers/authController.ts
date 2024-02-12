import "reflect-metadata";
import { Response, Request } from "express";
import { ObjectId } from "bson";
import { error } from "console";
import { emailAdapter } from "../adapters/email-adapter";
import { AuthService } from "../application/auth-service";
import { jwtService } from "../application/jwt-service";
import { emailManager } from "../managers/email-manager";
import { CodeType } from "../models/code";
import { UserInputModel } from "../models/users/userInputModel";
import { QueryUserRepository } from "../query repozitory/queryUserRepository";
import { DeviceRepository } from "../repositories/device-repository";
import { UsersRepository } from "../repositories/users-repository";
import { httpStatuses } from "../routers/helpers/send-status";
import { DeviceMongoDbType, UsersMongoDbType, RequestWithBody } from "../types";
import { injectable } from "inversify";

@injectable()
export class AuthController {
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
    private queryUserRepository: QueryUserRepository,
    private deviceRepository: DeviceRepository,
  ) {}

  async login(req: Request, res: Response) {
    const user = await this.authService.checkCredentials(
      req.body.loginOrEmail,
      req.body.password,
    );
    if (user) {
      const deviceId = new ObjectId().toString();
      const userId = user._id.toString();
      const accessToken = await jwtService.createJWT(user);
      const refreshToken = await jwtService.createRefreshToken(
        userId,
        deviceId,
      );
      const lastActiveDate = await jwtService.getLastActiveDate(refreshToken);
      const newDevice: DeviceMongoDbType = {
        _id: new ObjectId(),
        ip: req.ip || "", 
        title: req.headers["user-agent"] || "title",
        lastActiveDate,
        deviceId,
        userId,
      };
      await this.authService.addNewDevice(newDevice);
      res
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
        .status(httpStatuses.OK_200)
        .send({ accessToken: accessToken });
      return;
    } else {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    }
  }
  async passwordRecovery(req: Request, res: Response) {
    const email = req.body.email;
    const user: UsersMongoDbType | null =
      await this.usersRepository.findUserByEmail(email);
    if (!user) {
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    }

    const updatedUser = await this.usersRepository.sendRecoveryMessage(user);

    try {
      emailAdapter.sendEmailWithRecoveryCode(
        user.email,
        updatedUser.recoveryCode!,
      );
      return res
        .status(httpStatuses.NO_CONTENT_204)
        .send({ message: "Recovery code sent" });
    } catch (error) {
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
        .send({ message: "Сервер на кофе-брейке!" });
    }
  }
  async newPassword(req: Request, res: Response) {
    const { newPassword, recoveryCode } = req.body;

    const user = await this.usersRepository.findUserByRecoryCode(recoveryCode);

    if (!user) {
      return res.status(httpStatuses.BAD_REQUEST_400).send({
        errorsMessages: [
          {
            message: "send recovery code",
            field: "recoveryCode",
          },
        ],
      });
    }
    const result = await this.authService.resetPasswordWithRecoveryCode(
      user._id,
      newPassword,
    );
    if (result.success) {
      return res
        .status(httpStatuses.NO_CONTENT_204)
        .send("code is valid and new password is accepted");
    }
  }
  async me(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    } else {
      const userViewModel = await this.queryUserRepository.findUserById(userId);
      return res.status(httpStatuses.OK_200).send(userViewModel);
    }
  }
  async registrationConfirmation(
    req: RequestWithBody<CodeType>,
    res: Response,
  ) {
    const currentDate = new Date();

    const user = await this.usersRepository.findUserByConfirmationCode(
      req.body.code,
    );

    if (!user) {
      return res.status(httpStatuses.BAD_REQUEST_400).send({
        errorsMessages: [
          { message: "User not found by this code", field: "code" },
        ],
      });
    }
    if (user.emailConfirmation!.isConfirmed) {
      return res.status(httpStatuses.BAD_REQUEST_400).send({
        errorsMessages: [{ message: "Email is confirmed", field: "code" }],
      });
    }
    if (user.emailConfirmation!.expirationDate < currentDate) {
      return res.status(httpStatuses.BAD_REQUEST_400).send({
        errorsMessages: [{ message: "The code is exparied", field: "code" }],
      });
    }
    if (user.emailConfirmation!.confirmationCode !== req.body.code) {
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({ errorsMessages: [{ message: "Invalid code", field: "code" }] });
    }

    await this.authService.updateConfirmEmailByUser(user._id.toString());

    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
  async registration(req: RequestWithBody<UserInputModel>, res: Response) {
    const user = await this.authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );

    if (user) {
      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    } else {
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
    }
  }
  async registrationEmailResending(
    req: RequestWithBody<UsersMongoDbType>,
    res: Response,
  ) {
    const user = await this.usersRepository.findUserByEmail(req.body.email);
    if (!user) {
      return res.sendStatus(httpStatuses.BAD_REQUEST_400);
    }

    if (user.emailConfirmation.isConfirmed) {
      return res
        .status(httpStatuses.BAD_REQUEST_400)
        .send({ message: "isConfirmed" });
    }

    const userId = req.body._id;
    const updatedUser =
      await this.authService.updateAndFindUserForEmailSend(userId);

    try {
      await emailManager.sendEmail(
        updatedUser!.email,
        updatedUser!.emailConfirmation.confirmationCode,
      );
    } catch {
      error("email is already confirmed", error);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
  async refreshToken(req: Request, res: Response) {
    const deviceId = req.deviceId!;
    const userId = req.userId!;

    try {
      const tokens = await this.authService.refreshTokens(userId, deviceId);
      const newLastActiveDate = await jwtService.getLastActiveDate(
        tokens.newRefreshToken,
      );
      await this.authService.updateRefreshTokenByDeviceId(
        deviceId,
        newLastActiveDate,
      );
      return res
        .status(httpStatuses.OK_200)
        .cookie("refreshToken", tokens.newRefreshToken, {
          httpOnly: true,
          secure: true,
        })
        .send({ accessToken: tokens.accessToken });
    } catch (error) {
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
        .send({ message: "Сервер на кофе-брейке!" });
    }
  }
  async logOut(req: Request, res: Response) {
    const deviceId = req.deviceId!;
    const userId = req.userId!;

    try {
      await this.deviceRepository.deleteDeviceById(userId, deviceId);

      return res.sendStatus(httpStatuses.NO_CONTENT_204);
    } catch (error) {
      console.error(error);
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
        .send({ message: "Сервер на кофе-брейке!" });
    }
  }
}
