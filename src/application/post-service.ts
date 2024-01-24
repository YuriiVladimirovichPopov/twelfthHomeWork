import "reflect-metadata";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostsRepository } from "../repositories/posts-repository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { Paginated } from "../routers/helpers/pagination";
import { PaginatedType } from "../routers/helpers/pagination";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { injectable } from "inversify";
import { ReactionsRepository } from "../repositories/reaction-repository";
import { UserModel } from "../domain/schemas/users.schema";
import { ExtendedReactionForPostModel, ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { ObjectId } from "mongodb";
import { PostModel } from "../domain/schemas/posts.schema";
import { LikeStatusType } from "../models/reaction/reactionInfoViewModel";
import { PostsMongoDb, UsersMongoDbType } from "../types";
import { UserViewModel } from "../models/users/userViewModel";


@injectable()
export class PostsService {
  
  constructor(
    private queryBlogsRepository: QueryBlogsRepository,
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
  async createPost(data: PostsInputModel, user?: UsersMongoDbType | null): Promise<PostsViewModel | null> {
    const blog = await this.queryBlogsRepository.findBlogById(data.blogId);
    if (!blog) return null;

    const newPost: PostsViewModel = {
      ...data,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: ReactionStatusEnum.None,
        newestLikes: user? [{      // TODO: можно ли так добавлять???
          addedAt: new Date().toISOString(),
          userId: user._id,
          login: user.login
      }] : []
      }       
    };
    const createdPost =
      await this.postsRepository.createdPostForSpecificBlog(newPost, user);

    return createdPost;
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
  
  async updatePostLikesInfo(post: PostsMongoDb) {
    const [likesCount, dislikesCount] = await Promise.all([
      ReactionModel.countDocuments({ parentId: post._id.toString(), myStatus: ReactionStatusEnum.Like }),
      ReactionModel.countDocuments({ parentId: post._id.toString(), myStatus: ReactionStatusEnum.Dislike })
    ]);
      // TODO: три последних лайка храним отдельно, для этого создаем отдельную модель и потом к ней обращаемся
    const myStatus = post.extendedLikesInfo.myStatus;

    const newestLikes = post.extendedLikesInfo.newestLikes
      .filter((like: LikeStatusType) => like.myStatus !== ReactionStatusEnum.None)  
      //TODO: сюда еще скорей всего надо добавить !== ReactionStatusEnum.Dislike
      .sort((a: LikeStatusType, b: LikeStatusType) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    

    post.extendedLikesInfo = { likesCount, dislikesCount, myStatus, newestLikes };
    await PostModel.findByIdAndUpdate(post._id.toString(), { likesInfo: post.extendedLikesInfo });
    console.log("Post likes info updated:   ", post.extendedLikesInfo);
  }
  

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async deleteAllPosts(): Promise<boolean> {
    return await this.postsRepository.deleteAllPosts();
  }
}
