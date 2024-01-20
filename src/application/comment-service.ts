import "reflect-metadata";
import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { ReactionsService } from "./reaction-service";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { injectable } from "inversify";
import { Document } from "mongoose";
import { UserModel } from "../domain/schemas/users.schema";
import { ReactionsRepository } from "../repositories/reaction-repository";


@injectable()
export class CommentsService {
    constructor(
        private commentsQueryRepository: CommentsQueryRepository,
        private reactionsService: ReactionsService,
        private reactionsRepository: ReactionsRepository,
    ) {}
  //TODO: везде расставить логи для выяснения работы методов, 
  //TODO: также надо скорей всего обьединить методы на обновление реакции и подсчитывания ее!!! РАБОТАЙ РЕЩЕ!!!

    /* async updateLikesDislikes1(   // лучше разбить метод на составляющие. МОЖЕТ БЫТЬ!
        commentId: string,
        userId: string,
        action: "like" | "dislike" | "cancel-like" | "cancel-dislike" | "switch-like-dislike"
      ): Promise<CommentsMongoDbType | null> { //TODO: тут скорей всего проблема с типом из-за майСтатуса и CommentViewModel
        const comment = await CommentModel.findById(commentId);  
        if (!comment) {
          return null;
        }
        
        let reaction = await ReactionModel.findOne({ parentId: commentId, userId });  // Поиск существующей реакции
        console.log('updateLikes', reaction) //TODO сюда попадает  приходит null
        if (!reaction)
         reaction = await ReactionModel.create({
          parentId: commentId, 
          userId,
        })  // записываем сюда поля из ReactionSchema
      
      
        switch (action) {     // Обработка различных действий
          case "like":
          case "dislike":
            if (!reaction) {
                console.log(reaction, 'reaction')
              reaction = new ReactionModel({
                parentId: commentId,
                userId,
                likesCount: action === "like" ? 1 : 0,
                dislikesCount: action === "dislike" ? 1 : 0,
                myStatus: action === "like" ? ReactionStatusEnum.Like : ReactionStatusEnum.Dislike,
              });
            } else {
              reaction.myStatus = action === "like" ? ReactionStatusEnum.Like : ReactionStatusEnum.Dislike;
              reaction.likesCount = action === "like" ? reaction.likesCount + 1 : reaction.likesCount;
              reaction.dislikesCount = action === "dislike" ? reaction.dislikesCount + 1 : reaction.dislikesCount;
            }
            break;
          case "cancel-like":
          case "cancel-dislike":
            if (reaction && (reaction.myStatus === ReactionStatusEnum.Like || reaction.myStatus === ReactionStatusEnum.Dislike)) {
              reaction.myStatus = ReactionStatusEnum.None;
              reaction.likesCount = action === "cancel-like" ? reaction.likesCount - 1 : reaction.likesCount;
              reaction.dislikesCount = action === "cancel-dislike" ? reaction.dislikesCount - 1 : reaction.dislikesCount;
            }
            break;
          case "switch-like-dislike":
            if (reaction) {
              reaction.myStatus = reaction.myStatus === ReactionStatusEnum.Like ? ReactionStatusEnum.Dislike : ReactionStatusEnum.Like;
              reaction.likesCount = reaction.myStatus === ReactionStatusEnum.Like ? reaction.likesCount + 1 : reaction.likesCount - 1;
              reaction.dislikesCount = reaction.myStatus === ReactionStatusEnum.Dislike ? reaction.dislikesCount + 1 : reaction.dislikesCount - 1;
            }
            break; 
        }    
        
        if (reaction) {    // Сохранение или удаление реакции
          await reaction.save();
          console.log(reaction, 'save');
        }
        
        const likesCount = await ReactionModel.countDocuments({   // Обновление количества лайков/дизлайков в комментарии
            parentId: commentId, 
            myStatus: ReactionStatusEnum.Like 
            });
        const dislikesCount = await ReactionModel.countDocuments({ 
            parentId: commentId, 
            myStatus: ReactionStatusEnum.Dislike 
            });
        comment.likesInfo.likesCount = likesCount;
        comment.likesInfo.dislikesCount = dislikesCount;
        await comment.save();
       console.log(comment, "created comment")
        return comment;
      } */

      async updateLikesDislikes(
        commentId: string,
        userId: string,
        action: "None" | "Like" | "Dislike" 
        ) {

          console.log(action, 'Action')
        const comment = await this.commentsQueryRepository.findCommentById(commentId, userId);

        if (!comment) {
          return null;
        }
      
        let reaction = await this.reactionsRepository.findByParentAndUserIds(commentId, userId);
        console.log('Current reaction:    ', reaction);
      
        if (!reaction) {
          const user = await UserModel.findOne({_id: new ObjectId(userId)})
          reaction = new ReactionModel({
            _id: new ObjectId(),
            parentId: commentId, 
            userId,
            userLogin: user!.login,
            myStatus: ReactionStatusEnum.None,
          });
        }
      
        switch (action) {
          case "Like":
            reaction.myStatus = ReactionStatusEnum.Like;
            break;
          case "Dislike":
            reaction.myStatus = ReactionStatusEnum.Dislike;
            break;
          case "None":
            reaction.myStatus = ReactionStatusEnum.None;
            break;
          default:
            console.error("Invalid action:", action);
            return null;
        }
    
        await reaction.save();
        console.log('Reaction updated: ============================================');
      
        await this.updateCommentLikesInfo(comment);
        return comment;
      }
      
      async updateCommentLikesInfo(comment: CommentViewModel) {
        const [likesCount, dislikesCount] = await Promise.all([
          ReactionModel.countDocuments({ parentId: comment.id, myStatus: ReactionStatusEnum.Like }),
          ReactionModel.countDocuments({ parentId: comment.id, myStatus: ReactionStatusEnum.Dislike })
        ]);

        const myStatus = comment.likesInfo.myStatus;

        comment.likesInfo = { likesCount, dislikesCount, myStatus };
        // Here, update the CommentModel directly since `comment` is just a ViewModel
        await CommentModel.findByIdAndUpdate(comment.id, { likesInfo: comment.likesInfo });
        console.log("Comment likes info updated:   ", comment.likesInfo);
      }
      
      
      

  async countUserReactions (userId: string): Promise<{ likes: number; dislikes: number }> {
    const reactions = await CommentModel.aggregate([
      { $unwind: "$likesInfo" },
      {
        $group: {
          _id: "$likesInfo.userId",
          likes: { $sum: { $cond: [{ $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Like] }, 1, 0] } },
          dislikes: { $sum: { $cond: [{ $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Dislike] }, 1, 0] } },
        },
      },
      { $match: { _id: new ObjectId(userId) } },
    ]);
    console.log(this.countUserReactions,'countUserReactions')
    return reactions.length > 0 ? reactions[0] : { likes: 0, dislikes: 0 };
  }

  async changeReactionForComment(
    commentId: string, 
    userId: string, 
    userLogin: string, 
    likeStatus: ReactionStatusEnum) {
        console.log(this.changeReactionForComment,'changeReactionForComment')  // TODO почему this.надо в логах расставлять?
    const comment = await this.commentsQueryRepository.findCommentById(commentId);
    if (!comment) throw new Error("Comment not found");
    return this.reactionsService.updateReactionByParentId(commentId, userId, userLogin, likeStatus);
  }
}



