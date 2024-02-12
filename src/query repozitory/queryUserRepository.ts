import "reflect-metadata";
import { randomUUID } from "crypto";
import { UsersMongoDbType } from "../types";
import { UserModel } from "../domain/schemas/users.schema";
import mongoose from "mongoose";
import { injectable } from "inversify";

const filter: mongoose.FilterQuery<UsersMongoDbType> = {};

@injectable()
export class QueryUserRepository {
  _userMapper(user: UsersMongoDbType) {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      emailConfirmation: user.emailConfirmation,
      recoveryCode: randomUUID(),
    };
  }

  async findUserById(id: string): Promise<UsersMongoDbType | null> {
    const userById = await UserModel.findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        projection: {
          passwordSalt: 0,
          passwordHash: 0,
          emailConfirmation: 0,
          refreshTokenBlackList: 0,
        },
      },
    );
    if (!userById) {
      return null;
    }
    return userById;
  }

  async findLoginById(userId: string): Promise<string | null> {
    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }

    return user.login;
  }
}
