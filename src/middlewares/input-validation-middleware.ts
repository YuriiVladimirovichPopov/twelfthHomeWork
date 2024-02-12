import { Response, Request, NextFunction } from "express";
import { validationResult } from "express-validator";
import { httpStatuses } from "../routers/helpers/send-status";

export const authorizationValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);
  const [authType, authData] = auth.split(" ");
  if (authType !== "Basic" || authData !== "YWRtaW46cXdlcnR5")
    return res.sendStatus(401);
  return next();
};

export const inputValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req).formatWith((error: any) => ({
    //TODO: any don't like. Need change
    message: error.msg,
    field: error.path,
  }));

  if (!errors.isEmpty()) {
    const errorsMessages = errors.array({ onlyFirstError: true });

    res.status(httpStatuses.BAD_REQUEST_400).send({ errorsMessages });
    return;
  } else {
    next();
  }
};
