import { Request, Response, NextFunction } from "express";
import { jwtService } from "../../application/jwt-service";
import { UserModel } from "../../domain/schemas/users.schema";
import { ObjectId } from "mongodb";
import { UsersMongoDbType } from "../../types";

export const guestAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next();
    }

    const token = authorization.split(" ")[1];

    const userId = await jwtService.getUserIdByToken(token);

    if (!userId) {
      return next();
    }

    const user: UsersMongoDbType | null = await UserModel.findOne({
      _id: new ObjectId(userId),
    });

    if (user) {
      req.body.user = user;
    }

    return next();
  } catch (error) {
    console.log("Error in guestAccessMiddleware", error);
  }
};
