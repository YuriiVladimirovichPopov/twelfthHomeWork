import "reflect-metadata";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostsRepository } from "../repositories/posts-repository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { Paginated } from "../routers/helpers/pagination";
import { PaginatedType } from "../routers/helpers/pagination";
import { injectable } from "inversify";
import { ReactionsRepository } from "../repositories/reaction-repository";
import { UserModel } from "../domain/schemas/users.schema";
import {
  ReactionModel,
  ReactionStatusEnum,
} from "../domain/schemas/reactionInfo.schema";
import { ObjectId } from "mongodb";
import { PostModel } from "../domain/schemas/posts.schema";
import { ReactionsService } from "./reaction-service";
import { PostsMongoDb } from "../types";

@injectable()
export class PostsService {
  constructor(
    private queryPostRepository: QueryPostRepository,
    private postsRepository: PostsRepository,
    private reactionsRepository: ReactionsRepository,
    private reactionsService: ReactionsService,
  ) {}

  async findAllPosts(
    pagination: PaginatedType,
    userId: string,
  ): Promise<Paginated<PostsViewModel>> {
    return await this.queryPostRepository.findAllPosts(pagination, userId);
  }

  async findPostById(
    id: string,
    userId: string,
  ): Promise<PostsViewModel | null> {
    return await this.queryPostRepository.findPostById(id, userId);
  }

  async updatePost(
    id: string,
    data: PostsInputModel,
  ): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.updatePost(id, { ...data });
  }

  async updateLikesDislikesForPost(
    postId: string,
    userId: string,
    action: "None" | "Like" | "Dislike",
  ) {
    const post = await this.queryPostRepository.findPostById(postId, userId);

    if (!post) {
      return null;
    }

    let reaction = await this.reactionsRepository.findByParentAndUserIds(
      postId,
      userId,
    );

    if (!reaction) {
      const user = await UserModel.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        console.error("User not found");
        return null;
      }
      reaction = new ReactionModel({
        _id: new ObjectId(),
        parentId: postId,
        userId,
        userLogin: user.login,
        myStatus: ReactionStatusEnum,
        createdAt: new Date().toISOString(),
      });
    }

    // Обновляем статус реакции в соответствии с новым действием
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

    // Пересчитываем количество лайков и дизлайков
    await this.recalculateLikesCount(
      reaction.myStatus,
      post.extendedLikesInfo.myStatus,
    );

    await this.updatePostLikesInfo(post);
    return post;
  }

  async updatePostLikesInfo(post: PostsViewModel) {
    await this.postsRepository.updatePostLikesInfo(post);
  }

  //не используется
  async countUserReactions(
    userId: string,
  ): Promise<{ likes: number; dislikes: number }> {
    const reactions = await PostModel.aggregate([
      { $unwind: "$likesInfo" },
      {
        $group: {
          _id: "$likesInfo.userId",
          likes: {
            $sum: {
              $cond: [
                { $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Like] },
                1,
                0,
              ],
            },
          },
          dislikes: {
            $sum: {
              $cond: [
                { $eq: ["$likesInfo.myStatus", ReactionStatusEnum.Dislike] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $match: { _id: new ObjectId(userId) } },
    ]);
    return reactions.length > 0 ? reactions[0] : { likes: 0, dislikes: 0 };
  }

  //не используется
  async changeReactionForPost(
    postId: string,
    userId: string,
    likeStatus: ReactionStatusEnum,
  ) {
    const post = await this.queryPostRepository.findPostById(postId, userId);
    if (!post) throw new Error("Comment not found");
    return this.reactionsService.updateReactionByParentId(
      postId,
      userId,
      likeStatus,
    );
  }

  async recalculateLikesCount(
    updateLikeStatus: ReactionStatusEnum,
    previousLikeType: ReactionStatusEnum = ReactionStatusEnum.None,
  ) {
    const that = this as unknown as PostsMongoDb;

    if (!that.extendedLikesInfo) {
      that.extendedLikesInfo = {
        likesCount: 0,
        dislikesCount: 0,
        newestLikes: [],
      };
    } else {
      that.extendedLikesInfo = { ...that.extendedLikesInfo };
    }
    if (previousLikeType === updateLikeStatus) return;

    //уменьшаем количество лайков или дизлайков
    if (previousLikeType === ReactionStatusEnum.Like)
      that.extendedLikesInfo.likesCount--;
    if (previousLikeType === ReactionStatusEnum.Dislike)
      that.extendedLikesInfo.dislikesCount--;
  }

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async deleteAllPosts(): Promise<boolean> {
    return await this.postsRepository.deleteAllPosts();
  }
}
