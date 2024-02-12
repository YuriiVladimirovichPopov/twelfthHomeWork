import "reflect-metadata";
import { Response, Request } from "express";
import { BlogsRepository } from "../repositories/blogs-repository";
import { CommentsRepository } from "../repositories/comments-repository";
import { DeviceRepository } from "../repositories/device-repository";
import { PostsRepository } from "../repositories/posts-repository";
import { UsersRepository } from "../repositories/users-repository";
import { httpStatuses } from "../routers/helpers/send-status";
import { injectable } from "inversify";

@injectable()
export class TestController {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    private commentsRepository: CommentsRepository,
    private deviceRepository: DeviceRepository,
    private usersRepository: UsersRepository,
  ) {}
  async allData(req: Request, res: Response) {
    this.blogsRepository.deleteAllBlogs();
    this.postsRepository.deleteAllPosts();
    this.usersRepository.deleteAllUsers();
    this.commentsRepository.deleteAllComment();
    this.deviceRepository.deleteAllDevices();
    return res.status(httpStatuses.NO_CONTENT_204).send("All data is deleted");
  }
}
