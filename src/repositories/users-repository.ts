import "reflect-metadata";
import { ObjectId } from "mongodb";
import { UsersMongoDbType } from "../types";
import { UserPagination } from "../routers/helpers/pagination";
import { UserViewModel } from "../models/users/userViewModel";
import { Paginated } from "../routers/helpers/pagination";
import { UserCreateViewModel } from "../models/users/createUser";
import { UserModel } from "../domain/schemas/users.schema";
import { randomUUID } from "crypto";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { injectable } from "inversify";

@injectable()
export class UsersRepository {
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

  async findAllUsers(
    pagination: UserPagination,
  ): Promise<Paginated<UserViewModel>> {
    let filter = {};
    if (pagination.searchEmailTerm && pagination.searchLoginTerm) {
      filter = {
        $or: [
          { email: { $regex: pagination.searchEmailTerm, $options: "i" } },
          { login: { $regex: pagination.searchLoginTerm, $options: "i" } },
        ],
      };
    } else if (pagination.searchEmailTerm) {
      filter = { email: { $regex: pagination.searchEmailTerm, $options: "i" } };
    } else if (pagination.searchLoginTerm) {
      filter = { login: { $regex: pagination.searchLoginTerm, $options: "i" } };
    }

    const result: UsersMongoDbType[] = await UserModel.find(filter, {
      projection: { passwordSalt: 0, passwordHash: 0 },
    })

      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await UserModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const res: Paginated<UserViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((b) => this._userMapper(b)),
    };
    return res;
  }

  async findByLoginOrEmail(loginOrEmail: string) {
    const user = await UserModel.findOne({
      $or: [{ email: loginOrEmail }, { login: loginOrEmail }],
    });
    return user;
  }

  async findUserByEmail(email: string): Promise<UsersMongoDbType | null> {
    const user = await UserModel.findOne({ email: email });
    return user;
  }

  async findUserByConfirmationCode(emailConfirmationCode: string) {
    const user = await UserModel.findOne({
      "emailConfirmation.confirmationCode": emailConfirmationCode,
    });
    return user;
  }
 
  async createUser(newUser: UsersMongoDbType): Promise<UserCreateViewModel> {
    await UserModel.insertMany(newUser);
    return {
      id: newUser._id.toString(),
      login: newUser.login,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }

  async deleteUserById(id: string): Promise<PostsViewModel | boolean> {
    const deletedUser = await UserModel.deleteOne({ _id: new ObjectId(id) });
    return deletedUser.deletedCount === 1;
  }
  async deleteAllUsers(): Promise<boolean> {
    try {
      const result = await UserModel.deleteMany({});
      return result.acknowledged === true;
    } catch (error) {
      return false;
    }
  }

  async findUserByRecoryCode(
    recoveryCode: string,
  ): Promise<UsersMongoDbType | null> {
    const user = await UserModel.findOne({ recoveryCode });
    return user;
  }

  async sendRecoveryMessage(user: UsersMongoDbType): Promise<UsersMongoDbType> {
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedUser: UsersMongoDbType | null =
      await UserModel.findByIdAndUpdate(
        { _id: user._id },
        { $set: { recoveryCode } },
      );
    return updatedUser!;
  }
}
