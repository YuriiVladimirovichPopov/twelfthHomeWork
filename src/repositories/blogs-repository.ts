import "reflect-metadata";
import { ObjectId } from "mongodb";
import { BlogInputModel } from "../models/blogs/blogsInputModel";
import { BlogsMongoDbType } from "../types";
import { BlogViewModel } from "../models/blogs/blogsViewModel";
import { BlogModel } from "../domain/schemas/blogs.schema";
import { injectable } from "inversify";

@injectable()
export class BlogsRepository {
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

  async createBlog(newBlog: BlogsMongoDbType): Promise<BlogViewModel> {
    const blog = new BlogModel(newBlog);
    await blog.save();
    return this._blogMapper(newBlog);
  }

  async updateBlog(id: string, data: BlogInputModel): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const foundBlogById = await BlogModel.updateOne(
      { _id },
      { $set: { ...data } },
    );
    return foundBlogById.matchedCount === 1;
  }

  async deleteBlog(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const _id = new ObjectId(id);
    const foundBlogById = await BlogModel.deleteOne({ _id });

    return foundBlogById.deletedCount === 1;
  }

  async deleteAllBlogs(): Promise<boolean> {
    try {
      const result = await BlogModel.deleteMany({});
      return result.acknowledged === true;
    } catch (error) {
      return false;
    }
  }
}
