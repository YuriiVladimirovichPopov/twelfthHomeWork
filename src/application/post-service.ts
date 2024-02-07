import "reflect-metadata";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostsRepository } from "../repositories/posts-repository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { Paginated } from "../routers/helpers/pagination";
import { PaginatedType } from "../routers/helpers/pagination";
import { injectable } from "inversify";
import { ReactionsRepository } from "../repositories/reaction-repository";
import { UserModel } from '../domain/schemas/users.schema';
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { ObjectId } from "mongodb";
import {  PostModel } from "../domain/schemas/posts.schema";
import { reactionsService } from '../composition-root';
import { ReactionsService } from "./reaction-service";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { UserViewModel } from "../models/users/userViewModel";
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
  ): Promise<Paginated<PostsViewModel>> {
    return await this.queryPostRepository.findAllPosts(pagination);
  }

  async findPostById(id: string, userId: string): Promise<PostsViewModel | null> {
    return await this.queryPostRepository.findPostById(id, userId);
  }

  /* async createPost(data: PostsInputModel, user: UserViewModel | null): Promise<PostsViewModel | null> { // TODO тут беда с типом!!!!
    const blog = await this.queryBlogsRepository.findBlogById(data.blogId);  
    if (!blog) return null;
    const newPost: PostsMongoDb = {    
      _id: new ObjectId(),
      ...data,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        newestLikes: user ? [{
          addedAt: new Date().toISOString(),
          userId: user.id,
          login: user.login
        }] : []
      } // TODO: нужно поменять этот метод, м/б подобно коммент репе креатеКоммент
    };
    const createdPost =
      await this.postsRepository.createdPostForSpecificBlog(newPost);
console.log("createdPost", createdPost);
    return createdPost;
  } */

  

  async updatePost(
    id: string,
    data: PostsInputModel,
  ): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.updatePost(id, { ...data });
  }

  async updateLikesDislikesForPost(
    postId: string,
    userId: string,
    userLogin: string,     // TODO добавил
    reactionStatus: ReactionStatusEnum,     // TODO добавил
    action: "None" | "Like" | "Dislike" 
    ) {

      console.log('Action первое действие',        action, )
    const post = await this.queryPostRepository.findPostById(postId, userId);

    if (!post) {
      return null;
    }
  
    let reaction = await this.reactionsRepository.findByParentIdAndUserId(postId, userId, userLogin, reactionStatus);  
     // TODO добавил  userLogin  reactionStatus
     let newestReaction 
    if (!reaction) {
      const user = await UserModel.findOne({_id: new ObjectId(userId)})
      if (!user) {
        console.error("User not found");
        return null;
      }
      reaction = new ReactionModel({
        _id: new ObjectId(),
        parentId: postId, 
        userId,
        userLogin: user.login,    
        myStatus: ReactionStatusEnum.None,
        createdAt: new Date().toISOString(),    
      });

      /* if (action === ReactionStatusEnum.Like) {
        newestReaction = new NewestLikeDetailsForPostModel({
          addedAt: new Date().toISOString(),
          userId,
          login: user.login,
        })
      } */
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
  
    await this.updatePostLikesInfo(post);
    console.log('updated post', post);
    return post;
  }

  async updatePostLikesInfo(post: PostsViewModel) {
    await this.postsRepository.updatePostLikesInfo(post);
  }

  async countUserReactions (userId: string): Promise<{ likes: number; dislikes: number }> {
    const reactions = await PostModel.aggregate([
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

  async changeReactionForPost(
    postId: string, 
    userId: string, 
    userLogin: string, 
    likeStatus: ReactionStatusEnum) {
        console.log(this.changeReactionForPost,'changeReactionForComment') 
    const post = await this.queryPostRepository.findPostById(postId, userId);
    if (!post) throw new Error("Comment not found");
    return this.reactionsService.updateReactionByParentId(postId, userId, userLogin, likeStatus);
  }

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async deleteAllPosts(): Promise<boolean> {
    return await this.postsRepository.deleteAllPosts();
  }
}
