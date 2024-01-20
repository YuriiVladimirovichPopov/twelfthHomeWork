import "reflect-metadata";
import { CommentsMongoDbType, PostsMongoDbType } from "../types";
import { PaginatedType, Paginated } from "../routers/helpers/pagination";
import { ObjectId, WithId } from "mongodb";
import { PostsViewModel } from "../models/posts/postsViewModel";
import mongoose from "mongoose";
import { CommentModel } from "../domain/schemas/comments.schema";
import { PostModel } from "../domain/schemas/posts.schema";
import { injectable } from "inversify";

const filter: mongoose.FilterQuery<PostsMongoDbType> = {};


@injectable()
export class QueryPostRepository {
  _postMapper(post: PostsMongoDbType): PostsViewModel {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
    };
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
    const result: WithId<PostsMongoDbType>[] = await PostModel.find(filter)
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await PostModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    return {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((res) => this._postMapper(res)),
    };
  }

  async findPostById(id: string): Promise<PostsViewModel | null> {
    //console.log("Searching for post with ID:", id);
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const _id = new ObjectId(id);
    const findPost = await PostModel.findOne({ _id: _id });
    if (!findPost) {
      return null;
    }
    return this._postMapper(findPost);
  }

  async findAllCommentsforPostId(
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
