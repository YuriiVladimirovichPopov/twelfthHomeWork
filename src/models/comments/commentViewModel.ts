import "reflect-metadata";
import { injectable } from "inversify";
import { ReactionInfoViewModel } from "../reaction/reactionInfoViewModel";


export type CommentViewModel = {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: ReactionInfoViewModel;
};



@injectable()
export class CommentViewModel1 {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: ReactionInfoViewModel; 

  constructor(
    id: string,
    content: string,
      userId: string,
      userLogin: string,
    likesInfo: ReactionInfoViewModel, 
  ) {
    this.id = id;
    this.content = content;
    this.commentatorInfo = {
      userId,
      userLogin
    };
    this.createdAt = new Date().toISOString();
    this.likesInfo = likesInfo
  }
}

