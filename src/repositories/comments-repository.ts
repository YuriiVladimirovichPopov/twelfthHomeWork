import "reflect-metadata";
import { ObjectId } from "mongodb";
import { CommentModel } from "../domain/schemas/comments.schema";
import { CommentsMongoDbType } from "../types";
import { ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { injectable } from "inversify";

@injectable()
export class CommentsRepository {
  async createComment(
    parentId: string,
    postId: string,
    content: string,
    commentatorInfo: { userId: string; userLogin: string },
  ): Promise<CommentViewModel> {
    const createCommentForPost: CommentsMongoDbType = {
      _id: new ObjectId(),
      parentId,
      postId,
      content,
      commentatorInfo,
      createdAt: new Date().toISOString(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
      },
    };

    await CommentModel.create({ ...createCommentForPost });

    return {
      id: createCommentForPost._id.toString(),
      content: createCommentForPost.content,
      commentatorInfo: createCommentForPost.commentatorInfo,
      createdAt: createCommentForPost.createdAt,
      likesInfo: {
        ...createCommentForPost.likesInfo,
        myStatus: ReactionStatusEnum.None,
      },
    };
  }

  async updateComment(
    commentId: string,
    content: string,
  ): Promise<CommentsMongoDbType | undefined | boolean> {
    const filter = { _id: new ObjectId(commentId) };
    let foundComment = await CommentModel.findOne(filter);
    if (foundComment) {
      const result = await CommentModel.updateOne(filter, {
        $set: { content: content },
      });
      return result.matchedCount === 1;
    }
  }

  async deleteComment(commentId: string) {
    const result = await CommentModel.deleteOne({
      _id: new ObjectId(commentId),
    });
    return result.deletedCount === 1;
  }

  async deleteAllComment(): Promise<boolean> {
    const result = await CommentModel.deleteMany({});
    return result.acknowledged === true;
  }
}
