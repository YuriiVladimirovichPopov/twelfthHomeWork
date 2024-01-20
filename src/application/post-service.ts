import "reflect-metadata";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostsRepository } from "../repositories/posts-repository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import { Paginated } from "../routers/helpers/pagination";
import { PaginatedType } from "../routers/helpers/pagination";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { injectable } from "inversify";


@injectable()
export class PostsService {
  
  constructor(
    protected queryBlogsRepository: QueryBlogsRepository,
    protected queryPostRepository: QueryPostRepository,
    protected postsRepository: PostsRepository,
  ) {}

  async findAllPosts(
    pagination: PaginatedType,
  ): Promise<Paginated<PostsViewModel>> {
    return await this.queryPostRepository.findAllPosts(pagination);
  }

  async findPostById(id: string): Promise<PostsViewModel | null> {
    return await this.queryPostRepository.findPostById(id);
  }
  async createPost(data: PostsInputModel): Promise<PostsViewModel | null> {
    //TODO: change PostsInputModel
    const blog = await this.queryBlogsRepository.findBlogById(data.blogId);
    if (!blog) return null;

    const newPost = {
      ...data,
      blogName: blog.name,
      createdAt: new Date().toISOString(), // TODO: здесь добавляем нехватающие элементы
    };
    const createdPost =
      await this.postsRepository.createdPostForSpecificBlog(data);

    return createdPost;
  }

  async updatePost(
    id: string,
    data: PostsInputModel,
  ): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.updatePost(id, { ...data });
  }

  async deletePost(id: string): Promise<PostsViewModel | boolean> {
    return await this.postsRepository.deletePost(id);
  }

  async deleteAllPosts(): Promise<boolean> {
    return await this.postsRepository.deleteAllPosts();
  }
}
