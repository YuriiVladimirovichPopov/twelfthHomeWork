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
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { ObjectId } from "mongodb";
import { PostModel } from "../domain/schemas/posts.schema";
import { LikeStatusType, ReactionInfoViewModel } from "../models/reaction/reactionInfoViewModel";


@injectable()
export class PostsService {
  
  constructor(
    private queryPostRepository: QueryPostRepository,
    private postsRepository: PostsRepository,
    private reactionsRepository: ReactionsRepository
  ) {}

  async findAllPosts(
    pagination: PaginatedType,
  ): Promise<Paginated<PostsViewModel>> {
    return await this.queryPostRepository.findAllPosts(pagination);
  }

  async findPostById(id: string, userId: string): Promise<PostsViewModel | null> {
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
    action: "None" | "Like" | "Dislike" 
    ) {

      console.log(action, 'Action')
    const post = await this.queryPostRepository.findPostById(postId, userId);

    if (!post) {
      return null;
    }
  
    let reaction = await this.reactionsRepository.findByParentAndUserIds(postId, userId);
    console.log('Current reaction:    ', reaction);
  
    if (!reaction) {
      const user = await UserModel.findOne({_id: new ObjectId(userId)})
      reaction = new ReactionModel({
        _id: new ObjectId(),
        parentId: postId, 
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
  
    await this.updatePostLikesInfo(post);
    return post;
  }
  
  async updatePostLikesInfo(post: PostsViewModel) {
    const [likesCount, dislikesCount] = await Promise.all([
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Like }),
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Dislike })
    ]);
      // TODO: три последних лайка храним отдельно, для этого создаем отдельную модель и потом к ней обращаемся
    const myStatus = post.extendedLikesInfo.myStatus;

    const newestLikes = post.extendedLikesInfo
      .find((like: ReactionInfoViewModel) => 
        like.myStatus !== ReactionStatusEnum.None && 
        like.myStatus !== ReactionStatusEnum.Dislike)  
      .sort((a: LikeStatusType, b: LikeStatusType) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    

    post.extendedLikesInfo = { likesCount, dislikesCount, myStatus, newestLikes };
    await PostModel.findByIdAndUpdate(post.id.toString(), { likesInfo: post.extendedLikesInfo });
    console.log("Post likes info updated:   ", post.extendedLikesInfo);
  }
  

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async deleteAllPosts(): Promise<boolean> {
    return await this.postsRepository.deleteAllPosts();
  }
}
