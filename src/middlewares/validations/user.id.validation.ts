import { Request, Response, NextFunction } from "express";
import { httpStatuses } from "../../routers/helpers/send-status";
import { ObjectId } from "mongodb";

export const userValidationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || !req.user.id) {
    return res.sendStatus(httpStatuses.NOT_FOUND_404);
  }

  if (!ObjectId.isValid(req.user.id)) {
    return res.sendStatus(httpStatuses.NOT_FOUND_404);
  }

  next();
  return;
};
