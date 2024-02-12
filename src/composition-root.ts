import "reflect-metadata";
import { Container, injectable, inject } from "inversify";
import { AuthService } from "./application/auth-service";
import { BlogService } from "./application/blog-service";
import { CommentsService } from "./application/comment-service";
import { PostsService } from "./application/post-service";
import { ReactionsService } from "./application/reaction-service";
import { AuthController } from "./controllers/authController";
import { BlogsController } from "./controllers/blogsController";
import { CommentController } from "./controllers/commentController";
import { PostController } from "./controllers/postController";
import { SecurityController } from "./controllers/securityController";
import { TestController } from "./controllers/testController";
import { UserController } from "./controllers/userController";
import { QueryBlogsRepository } from "./query repozitory/queryBlogsRepository";
import { CommentsQueryRepository } from "./query repozitory/queryCommentsRepository";
import { QueryPostRepository } from "./query repozitory/queryPostsRepository";
import { QueryUserRepository } from "./query repozitory/queryUserRepository";
import { BlogsRepository } from "./repositories/blogs-repository";
import { CommentsRepository } from "./repositories/comments-repository";
import { DeviceRepository } from "./repositories/device-repository";
import { PostsRepository } from "./repositories/posts-repository";
import { ReactionsRepository } from "./repositories/reaction-repository";
import { UsersRepository } from "./repositories/users-repository";

export const container = new Container();

//Repositories
container.bind(QueryUserRepository).to(QueryUserRepository);
container.bind(UsersRepository).to(UsersRepository);
container.bind(BlogsRepository).to(BlogsRepository);
container
  .bind<QueryBlogsRepository>(QueryBlogsRepository)
  .to(QueryBlogsRepository);
container.bind(PostsRepository).to(PostsRepository);
container.bind(QueryPostRepository).to(QueryPostRepository);
container.bind(CommentsRepository).to(CommentsRepository);
container.bind(CommentsQueryRepository).to(CommentsQueryRepository);
container.bind(DeviceRepository).to(DeviceRepository);
container.bind(ReactionsRepository).to(ReactionsRepository);

//Services
container.bind(AuthService).to(AuthService);
container.bind(ReactionsService).to(ReactionsService);
container.bind(BlogService).to(BlogService);
container.bind(PostsService).to(PostsService);
container.bind(CommentsService).to(CommentsService);

// Controllers
container.bind(AuthController).to(AuthController);
container.bind(UserController).to(UserController);
container.bind(SecurityController).to(SecurityController);
container.bind(BlogsController).to(BlogsController);
container.bind(CommentController).to(CommentController);
container.bind(PostController).to(PostController);
container.bind(TestController).to(TestController);

export {
  AuthController,
  UserController,
  SecurityController,
  BlogsController,
  CommentController,
  PostController,
  TestController,
  AuthService,
  DeviceRepository,
  QueryBlogsRepository,
  QueryUserRepository,
  UsersRepository,
};
