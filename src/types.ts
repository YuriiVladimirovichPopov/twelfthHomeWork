import { Request } from "express";
import { ObjectId } from "mongodb";
import { UserViewModel } from "./models/users/userViewModel";
import { ReactionInfoDBModel, ReactionInfoViewModel } from "./models/reaction/reactionInfoViewModel";
import { ReactionStatusEnum } from "./domain/schemas/reactionInfo.schema";

export class BlogsMongoDbType {
  constructor(
    public _id: ObjectId,
    public createdAt: string,
    public name: string | null,
    public description: string,
    public websiteUrl: string,
    public isMembership: boolean,
  ) {}
}

export class PostsMongoDbType {
  constructor(
    public _id: ObjectId,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string | null,
    public createdAt: string,
  ) {}
}

export class UsersMongoDbType {
  constructor(
    public _id: ObjectId,
    public login: string,
    public email: string,
    public createdAt: string,
    public passwordHash: string,
    public passwordSalt: string,
    public emailConfirmation: EmailConfirmationType,
    public recoveryCode?: string,
  ) {}
}

export type EmailConfirmationType = {
  isConfirmed: boolean;
  confirmationCode: string;
  expirationDate: Date;
};

export class createPostDTOType {
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: string,
  ) {}
}

export class CommentsMongoDbType {
  constructor(
    public _id: ObjectId,
    public postId: string,
    public parentId: string,
    public content: string,
    public commentatorInfo: {
      userId: string;
      userLogin: string;
    },
    public createdAt: string,
    public likesInfo: ReactionInfoDBModel,
  ) {}
}

export class DeviceMongoDbType {
  constructor(
    public _id: ObjectId,
    public ip: string,
    public title: string,
    public lastActiveDate: string,
    public deviceId: string,
    public userId: string,
  ) {}
}

export class RateLimitMongoDbType {
  constructor(
    public IP: string,
    public URL: string,
    public date: Date,
  ) {}
}

export class ReactionMongoDb {
  constructor(
    public _id: ObjectId,
    public parentId: string,
    public userId: string,
    public userLogin: string,
    public myStatus: ReactionStatusEnum,
    public createdAt: string,
    public updatedAt: boolean,
  ) {}
}

export type RegistrationDataType = {
  ip: string;
};

export type RequestWithParams<T> = Request<
  T,
  {},
  {},
  {},
  { user: UserViewModel }
>;
export type RequestWithBody<T> = Request<{}, {}, T>;

export type RequestWithUser<U extends UserViewModel> = Request<
  {},
  {},
  {},
  {},
  U
>;
