import "reflect-metadata";
import { PostsMongoDb } from "../types";
import { ObjectId } from "mongodb";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostModel } from "../domain/schemas/posts.schema";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { injectable } from "inversify";
import { ExtendedReactionInfoViewModelForPost } from "../models/reaction/reactionInfoViewModel";
import { ExtendedReactionForPostModel } from "../domain/schemas/posts.schema";
import { ReactionModel, ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";


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
        myStatus: postReaction?.myStatus || ReactionStatusEnum.None,
        newestLikes: postReaction.newestLikes,
      }
    }
  }
    //TODO: переписать этот метод, сделать подобным async createComment
  async createdPostForSpecificBlog(newPost: PostsViewModel ): Promise<PostsViewModel | null> {
    const blog = await this.queryBlogsRepository.findBlogById(newPost.blogId);
    if (!blog) {
      return null;
    }
  
    const createPostForBlog: PostsMongoDb = {   //TODO: тут все хорошо. Тесты требуют myStatus! одно 'НО'
      _id: new ObjectId(),
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: newPost.extendedLikesInfo?.likesCount || 0,
        dislikesCount: newPost.extendedLikesInfo?.dislikesCount || 0,
        //myStatus: newPost.extendedLikesInfo?.myStatus,
        newestLikes: newPost.extendedLikesInfo?.newestLikes,   // TODO: добавил невестЛайкс
      },
    };
 
    try {
      const createdPost = await PostModel.create(createPostForBlog);
      const reaction: ExtendedReactionInfoViewModelForPost = await ExtendedReactionForPostModel.create({
        postId: createdPost._id, 
        likesCount: createPostForBlog.extendedLikesInfo.likesCount,
        dislikesCount: createPostForBlog.extendedLikesInfo.dislikesCount,
        myStatus: ReactionStatusEnum.None,
        newestLikes: []
      });
      
  
      return this.postMapper(createPostForBlog, reaction);
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
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

  /* async updatePostLikesInfo(post: PostsViewModel) {
    const [likesCount, dislikesCount] = await Promise.all([
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Like }),
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Dislike })
    ]);
  
    // Получаем информацию о три последних лайках
    const newestLikes = await NewestLikeDetailsForPostModel
      .find({ parentId: post.id.toString() })
      .sort({ addedAt: -1 }) // Сортируем по убыванию времени добавления
      .limit(3)
      .exec();
    console.log(" newest", newestLikes)
    const myStatus = post.extendedLikesInfo.myStatus;
    console.log(" myStatus", myStatus)
    post.extendedLikesInfo = { likesCount, dislikesCount, myStatus, newestLikes };
  
    // Обновляем поле newestLikes в модели ExtendedReactionForPostModel
    await PostModel.findByIdAndUpdate(post.id.toString(), {   // TODO: здесь скорей всего ошибка 
      'extendedLikesInfo.newestLikes': newestLikes,
      likesInfo: post.extendedLikesInfo
    });
  
    console.log("Post likes info updated:   ", post.extendedLikesInfo);
  } */

  async updatePostLikesInfo(post: PostsViewModel) {
    const [likesCount, dislikesCount] = await Promise.all([
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Like }),
      ReactionModel.countDocuments({ parentId: post.id.toString(), myStatus: ReactionStatusEnum.Dislike })
    ]);
  
    // Получаем информацию о 3-х последних лайках
    const newestLikes = await ReactionModel  
      .find({ parentId: post.id.toString() })
      .sort({ addedAt: -1 }) // Сортируем по убыванию времени добавления
      .limit(3)
      .exec();
  
    // Преобразуем объекты из newestLikes в ожидаемый формат
    const formattedNewestLikes = newestLikes.map(like => ({
      addedAt: like.createdAt,
      userId: like.userId,
      login: like.userLogin
    }));
  
    // Создаем объект с обновленными данными
    const updatedExtendedReaction: ExtendedReactionInfoViewModelForPost = {
      likesCount,
      dislikesCount,
      myStatus: post.extendedLikesInfo.myStatus,
      newestLikes: formattedNewestLikes
    };
    console.log("Post likes info updated: ", updatedExtendedReaction);
    // Обновляем поле extendedLikesInfo в документе PostModel
    await PostModel.findByIdAndUpdate(post.id.toString(), {
      'extendedLikesInfo': updatedExtendedReaction
    });
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
