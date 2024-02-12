import { UserViewModel } from "../models/users/userViewModel";
import { MeViewType } from "../models/";
import { UsersMongoDbType } from "../types";

declare global {
  declare namespace Express {
    export interface Request {
      userId?: string;
      deviceId?: string;
      user?: UserViewModel | null | undefined;
    }
  }
}
