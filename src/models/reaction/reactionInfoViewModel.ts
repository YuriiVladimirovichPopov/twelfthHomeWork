import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export type ReactionInfoViewModel = {
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatusEnum;
};

export type ExtendedReactionInfoViewModelForPost = {
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatusEnum;
  newestLikes: NewestLikeDetailsViewModel[];
};

export type ReactionInfoDBModel = {
  likesCount: number;
  dislikesCount: number;
};

export type ReactionInfoDBModelForPost = {
  likesCount: number;
  dislikesCount: number;
  newestLikes: NewestLikeDetailsViewModel[];
};

export type NewestLikeDetailsViewModel = {
  addedAt: string;
  userId: string;
  login: string | null;
};
