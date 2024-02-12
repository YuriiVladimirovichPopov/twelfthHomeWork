import "reflect-metadata";
import { Response, Request } from "express";
import { BlogService } from "../application/blog-service";
import { BlogInputModel } from "../models/blogs/blogsInputModel";
import { BlogViewModel } from "../models/blogs/blogsViewModel";
import { getByIdParam } from "../models/getById";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { Paginated, parsePaginatedType } from "../routers/helpers/pagination";
import { httpStatuses } from "../routers/helpers/send-status";
import { RequestWithBody, RequestWithParams } from "../types";
import { injectable } from "inversify";
import { PostsRepository } from "../repositories/posts-repository";
import { UserViewModel } from "../models/users/userViewModel";

@injectable()
export class BlogsController {
  constructor(
    private blogService: BlogService,
    private postsRepository: PostsRepository,
    private queryPostRepository: QueryPostRepository,
  ) {}

  async getAllBlogs(req: Request, res: Response) {
    const pagination = parsePaginatedType(req.query);
    const allBlogs: Paginated<BlogViewModel> =
      await this.blogService.findAllBlogs(pagination);

    return res.status(httpStatuses.OK_200).send(allBlogs);
  }
  async createBlogs(
    req: RequestWithBody<BlogViewModel>,
    res: Response<BlogViewModel>,
  ) {
    const newBlog = await this.blogService.createBlog(req.body);
    return res.status(httpStatuses.CREATED_201).send(newBlog);
  }

  async getPostByBlogId(
    req: Request<{ blogId: string }, {}, { user: UserViewModel }, {}>,
    res: Response,
  ) {
    const blogWithPosts = await this.blogService.findBlogById(
      req.params.blogId,
    );
    if (!blogWithPosts) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    const pagination = parsePaginatedType(req.query);

    const foundBlogWithAllPosts: Paginated<PostsViewModel> =
      await this.queryPostRepository.findAllPostsByBlogId(
        req.params.blogId,
        pagination,
        req.body.user.id.toString(),
      );

    return res.status(httpStatuses.OK_200).send(foundBlogWithAllPosts);
  }

  async createPostForBlogById(req: Request, res: Response) {
    const blogId = req.params.blogId;

    const {
      id,
      title,
      shortDescription,
      content,
      blogName,
      createdAt,
      extendedLikesInfo,
    } = req.body;

    const newPostForBlogById: PostsViewModel | null =
      await this.postsRepository.createdPostForSpecificBlog({
        id,
        title,
        shortDescription,
        content,
        blogId,
        blogName,
        createdAt,
        extendedLikesInfo,
      });

    if (newPostForBlogById) {
      return res.status(httpStatuses.CREATED_201).send(newPostForBlogById);
    }
    return res.sendStatus(httpStatuses.NOT_FOUND_404);
  }

  async getBlogById(
    req: RequestWithParams<getByIdParam>,
    res: Response<BlogViewModel>,
  ) {
    const foundBlog = await this.blogService.findBlogById(req.params.id);
    if (!foundBlog) return res.sendStatus(httpStatuses.NOT_FOUND_404);

    return res.status(httpStatuses.OK_200).send(foundBlog);
  }

  async updateBlogById(
    req: Request<getByIdParam, BlogInputModel>,
    res: Response<BlogViewModel>,
  ) {
    const updateBlog = await this.blogService.updateBlog(
      req.params.id,
      req.body,
    );
    if (!updateBlog) return res.sendStatus(httpStatuses.NOT_FOUND_404);

    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }

  async deleteBlogById(req: RequestWithParams<getByIdParam>, res: Response) {
    const foundBlog = await this.blogService.deleteBlog(req.params.id);
    if (!foundBlog) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
}
