import "reflect-metadata";
import { ObjectId, WithId } from "mongodb";
import { BlogsMongoDbType } from "../types";
import { BlogViewModel } from "../models/blogs/blogsViewModel";
import { PaginatedType } from "../routers/helpers/pagination";
import { Paginated } from "../routers/helpers/pagination";
import { BlogModel } from "../domain/schemas/blogs.schema";
import { isValidObjectId } from "mongoose";
import { injectable } from "inversify";

@injectable()
export class QueryBlogsRepository {
  _blogMapper(blog: BlogsMongoDbType): BlogViewModel {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  async findAllBlogs(
    pagination: PaginatedType,
  ): Promise<Paginated<BlogViewModel>> {
    let filter = {};
    if (pagination.searchNameTerm) {
      filter = {
        name: { $regex: pagination.searchNameTerm || "", $options: "i" },
      };
    }
    const result: WithId<BlogsMongoDbType>[] = await BlogModel.find(filter)

      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    const totalCount: number = await BlogModel.countDocuments(filter);
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const res: Paginated<BlogViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: result.map((b) => this._blogMapper(b)),
    };
    return res;
  }

  async findBlogById(id: string): Promise<BlogViewModel | null> {
    if (!isValidObjectId(id)) return null;
    const blogById = await BlogModel.findOne({ _id: new ObjectId(id) });
    if (!blogById) {
      return null;
    }
    return this._blogMapper(blogById);
  }
}
