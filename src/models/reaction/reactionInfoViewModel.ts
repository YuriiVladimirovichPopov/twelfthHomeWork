import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export type ReactionInfoViewModel = {   
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatusEnum; 
};


export type ReactionInfoDBModel = {
  likesCount: number;
  dislikesCount: number;
};

export type LikeStatusType = {
  myStatus: ReactionStatusEnum,
  userId: string,
  createdAt: string
}