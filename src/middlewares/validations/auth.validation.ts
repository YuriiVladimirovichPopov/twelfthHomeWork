import { NextFunction, Request, Response } from "express";
import { jwtService } from "../../application/jwt-service";
import { httpStatuses } from "../../routers/helpers/send-status";
import { ObjectId } from "mongodb";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers.authorization) {
    return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
  }
  const typeAuth = req.headers.authorization.split(" ")[0];
  if (typeAuth !== "Bearer")
    return res.sendStatus(httpStatuses.UNAUTHORIZED_401);

  const token = req.headers.authorization.split(" ")[1];

  const userId = await jwtService.getUserIdByToken(token);

  if (!userId) {
    return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
  }
  if (!ObjectId.isValid(userId)) {
    return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
  }

  req.body.userId = userId; 

  next();
};
