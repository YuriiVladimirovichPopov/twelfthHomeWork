import "reflect-metadata";
import { PostsMongoDb, UsersMongoDbType } from "../types";
import { ObjectId } from "mongodb";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostModel } from "../domain/schemas/posts.schema";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { injectable } from "inversify";
import { ExtendedReactionInfoViewModelForPost } from "../models/reaction/reactionInfoViewModel";
import { ExtendedReactionForPostModel } from "../domain/schemas/posts.schema";


@injectable()
export class PostsRepository {
  private queryBlogsRepository: QueryBlogsRepository;
  
  constructor() {
    this.queryBlogsRepository = new QueryBlogsRepository();
    
  }

  private postMapper(post: PostsMongoDb, postReaction: ExtendedReactionInfoViewModelForPost): PostsViewModel {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName || null,
      createdAt: post.createdAt,
      extendedLikesInfo: {   
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: postReaction.myStatus,
        newestLikes: postReaction.newestLikes,
      }
    };
  }

  async createdPostForSpecificBlog(
    newPost: PostsViewModel, 
  ): Promise<PostsViewModel | null> {
    const blog = await this.queryBlogsRepository.findBlogById(newPost.blogId);
    if (!blog) {
      return null;
    }
    const createPostForBlog: PostsMongoDb = {
      _id: new ObjectId(),
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: blog.name,
      createdAt: new Date().toISOString(), 
      extendedLikesInfo: {
        likesCount: newPost.extendedLikesInfo.likesCount,
        dislikesCount: newPost.extendedLikesInfo.dislikesCount,
      } 
    };

    //await PostModel.create(createPostForBlog)

    const createdPost = 
    await await PostModel.create(createPostForBlog);// тут циклическая зависимость
    
    const reaction: ExtendedReactionInfoViewModelForPost = 
    await ExtendedReactionForPostModel.create(createdPost); //TODO: здесь тоже не очень красиво и не понятно!!!


    return this.postMapper(createPostForBlog, reaction); 
  }

  async updatePost(
    id: string,
    data: PostsInputModel,
  ): Promise<PostsViewModel | boolean> {
    const foundPostById = await PostModel.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data } },
    );
    return foundPostById.matchedCount === 1;
  }

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    const foundPostById = await PostModel.deleteOne({ _id: new ObjectId(id) });

    return foundPostById.deletedCount === 1;
  }

  async deleteAllPosts(): Promise<boolean> {
    try {
      const deletedPosts = await PostModel.deleteMany({});
      return deletedPosts.acknowledged === true;
    } catch (error) {
      return false;
    }
  }
}
