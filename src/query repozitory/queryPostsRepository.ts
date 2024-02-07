import "reflect-metadata";
import { CommentsMongoDbType, PostsMongoDb } from "../types";
import { PaginatedType, Paginated } from "../routers/helpers/pagination";
import { ObjectId, WithId } from "mongodb";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { CommentModel } from "../domain/schemas/comments.schema";
import { ExtendedReactionForPostModel, PostModel } from "../domain/schemas/posts.schema";
import { injectable } from "inversify";
import { ReactionModel, ReactionStatusEnum, userLoginValid } from "../domain/schemas/reactionInfo.schema";
import { ExtendedReactionInfoViewModelForPost, NewestLikeDetailsViewModel } from "../models/reaction/reactionInfoViewModel";
import { PostsInputModel } from "../models/posts/postsInputModel";


@injectable()
export class QueryPostRepository {
  _postMapper(post: PostsMongoDb, postReaction: ExtendedReactionInfoViewModelForPost): PostsViewModel { 
    return {    //TODO: надо поменять как в комментах и будет счастье по идее
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {   
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: postReaction?.myStatus || ReactionStatusEnum.None,
        newestLikes: postReaction.newestLikes ,
      }
    }
  }

  async findAllPostsByBlogId(
    blogId: string,
    pagination: PaginatedType,
  ): Promise<Paginated<PostsViewModel>> {
    const filter = { blogId };
    return this._findPostsByFilter(filter, pagination);
  }

  async findAllPosts(
    pagination: PaginatedType,
  ): Promise<Paginated<PostsViewModel>> {
    const filter = {};
    return this._findPostsByFilter(filter, pagination);
  }

  async _findPostsByFilter(
    filter: {},
    pagination: PaginatedType,
  ): Promise<Paginated<PostsViewModel>> {
    try {
      const result: WithId<PostsMongoDb>[] = await PostModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortDirection })
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean();
  
      const totalCount: number = await PostModel.countDocuments(filter);
      const pageCount: number = Math.ceil(totalCount / pagination.pageSize);
  
      const reactionsPromises: Promise<ExtendedReactionInfoViewModelForPost>[] = result.map(async (post) => {
        const res = await ExtendedReactionForPostModel.findOne({ postId: post._id.toString() }).lean();
  console.log('res',      res);
        return res ? {
          likesCount: res.likesCount,
          dislikesCount: res.dislikesCount,
          myStatus: ReactionStatusEnum.None,//TODO поменять!!!!
          newestLikes: res.newestLikes as NewestLikeDetailsViewModel[]
        } : {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: ReactionStatusEnum.None,
          newestLikes: [] as NewestLikeDetailsViewModel[]
        };
      });
  
      const reactions: ExtendedReactionInfoViewModelForPost[] = await Promise.all(reactionsPromises);
  
      const items: PostsViewModel[] = result.map((res, index) => this._postMapper(res, reactions[index]));
  
      return {
        pagesCount: pageCount,
        page: pagination.pageNumber,
        pageSize: pagination.pageSize,
        totalCount: totalCount,
        items: items,
      };
    } catch (error) {
      console.error("Error while finding posts:", error);
      throw error;
    }
  }
  

  async findPostById(id: string, userId?: string): Promise<PostsViewModel | null> { 
    //console.log("Searching for post with ID:", id);
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const _id = new ObjectId(id);
    const findPost = await PostModel.findOne({ _id: _id });
    
    if (!findPost) {
      return null;
    }

    let myStatus: ReactionStatusEnum = ReactionStatusEnum.None;
   
    console.log('=====userId)====', userId)
    if(userId){
      const reaction = await ReactionModel.findOne({userId: userId.toString(), parentId: id}) 
                                                                                  
      myStatus = reaction ? reaction.myStatus : ReactionStatusEnum.None      
    }

    const newestLikes = await ReactionModel.find({parentId: id}).sort({addedAt: -1}).limit(3)
    
    const extendedReaction = await ExtendedReactionForPostModel.findOne({ postId: findPost._id.toString() }).lean();
    console.log('extendedReaction', extendedReaction)

    const res = this._postMapper(findPost, {
      likesCount: extendedReaction ? extendedReaction.likesCount : 0,
      dislikesCount: extendedReaction ? extendedReaction.dislikesCount : 0,
      myStatus: myStatus,
      newestLikes: newestLikes.map(reaction => ({
        userId: reaction.userId,
        login: reaction.userLogin,
        addedAt: reaction.createdAt,
      })),
    });
    return res;
  }

  async findAllCommentsforPostId(    //TODO: сюда тоже юзерАйди засунуть?
    pagination: PaginatedType,
  ): Promise<Paginated<CommentsMongoDbType>> {
    const filter = {
      name: { $regex: pagination.searchNameTerm, $options: "i" },
    };
    const result: WithId<WithId<CommentsMongoDbType>>[] =
      await CommentModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortDirection })
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean();
    const totalCount: number = await CommentModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result,
    };
  }
}
