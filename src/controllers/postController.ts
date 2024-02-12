import "reflect-metadata";
import { Response, Request } from "express";
import { PostsService } from "../application/post-service";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { getByIdParam } from "../models/getById";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { QueryBlogsRepository } from "../query repozitory/queryBlogsRepository";
import { CommentsQueryRepository } from "../query repozitory/queryCommentsRepository";
import { QueryPostRepository } from "../query repozitory/queryPostsRepository";
import {
  Paginated,
  getPaginationFromQuery,
  PaginatedType,
} from "../routers/helpers/pagination";
import { httpStatuses } from "../routers/helpers/send-status";
import { RequestWithParams, UsersMongoDbType } from "../types";
import { injectable } from "inversify";
import { PostsRepository } from "../repositories/posts-repository";
import { ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";

@injectable()
export class PostController {
  queryUserRepository: any;
  commentsRepository: any;
  constructor(
    private postsService: PostsService,
    private queryBlogsRepository: QueryBlogsRepository,
    private queryPostRepository: QueryPostRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private postsRepository: PostsRepository,
  ) {}

  async getCommentsByPostId(
    req: Request,
    res: Response<Paginated<CommentViewModel>>,
  ) {
    const user = req.body.user as UsersMongoDbType | null;

    const foundedPostId = await this.queryPostRepository.findPostById(
      req.params.postId,
      req.body.userId,
    );
    if (!foundedPostId) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }

    const pagination: PaginatedType = getPaginationFromQuery(
      req.query as unknown as PaginatedType, // TODO bad solution
    );
    const allCommentsForPostId: Paginated<CommentViewModel> =
      await this.commentsQueryRepository.getAllCommentsForPost(
        req.params.postId,
        pagination,
        user?._id.toString(),
      );

    return res.status(httpStatuses.OK_200).send(allCommentsForPostId);
  }

  async createCommentsByPostId(req: Request, res: Response) {
    const postWithId: PostsViewModel | null =
      await this.queryPostRepository.findPostById(
        req.params.postId,
        req.body.userId,
      );
    if (!postWithId) {
      return res
        .status(httpStatuses.NOT_FOUND_404)
        .send({ message: "post not found" });
    }

    const userLogin = await this.queryUserRepository.findLoginById(
      req.body.userId,
    );
    if (!userLogin) {
      return res.status(httpStatuses.NOT_FOUND_404).send("User not found");
    }

    const comment: CommentViewModel | null =
      await this.commentsRepository.createComment(
        req.body.parentId,
        postWithId.id,
        req.body.content,
        {
          userId: req.body.userId,
          userLogin,
        },
      );
    return res.status(httpStatuses.CREATED_201).send(comment);
  }

  async getAllPosts(req: Request, res: Response<Paginated<PostsViewModel>>) {
    const pagination = getPaginationFromQuery(
      req.query as unknown as PaginatedType, // TODO bad solution
    );

    const allPosts: Paginated<PostsViewModel> =
      await this.queryPostRepository.findAllPosts(
        pagination,
        req.body.user?._id.toString(),
      );
    if (!allPosts) {
      return res.status(httpStatuses.NOT_FOUND_404);
    }
    res.status(httpStatuses.OK_200).send(allPosts);
  }

  async createPostByBlogId(req: Request, res: Response<PostsViewModel | null>) {
    const findBlogById = await this.queryBlogsRepository.findBlogById(
      req.body.blogId,
    );

    if (findBlogById) {
      const data: PostsViewModel = req.body;

      const newPost: PostsViewModel | null =
        await this.postsRepository.createdPostForSpecificBlog(data);

      if (!newPost) {
        return res.sendStatus(httpStatuses.BAD_REQUEST_400);
      }
      return res.status(httpStatuses.CREATED_201).send(newPost);
    }
  }

  async getPostById(req: Request, res: Response) {
    const foundPost = await this.postsService.findPostById(
      req.params.id,
      req.body.user?._id.toString(),
    );
    if (!foundPost) {
      res.sendStatus(httpStatuses.NOT_FOUND_404);
    } else {
      res.status(httpStatuses.OK_200).send(foundPost);
    }
  }

  async updatePostById(
    req: Request<getByIdParam, PostsInputModel>,
    res: Response<PostsViewModel>,
  ) {
    const updatePost = await this.postsService.updatePost(
      req.params.id,
      req.body,
    );

    if (!updatePost) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    } else {
      res.sendStatus(httpStatuses.NO_CONTENT_204);
    }
  }

  async updateLikesDislikesForPost(req: Request, res: Response) {
    try {
      const postId = req.params.postId;
      const userId = req.body.userId!;
      const likeStatus = req.body.likeStatus;

      // Проверяем наличие поля likeStatus в теле запроса
      if (
        likeStatus !== ReactionStatusEnum.Like &&
        likeStatus !== ReactionStatusEnum.Dislike &&
        likeStatus !== ReactionStatusEnum.None
      ) {
        return res
          .status(httpStatuses.BAD_REQUEST_400)
          .send({
            errorsMessages: [
              { message: "Like status is required", field: "likeStatus" },
            ],
          });
      }

      const updatedPost = await this.postsService.updateLikesDislikesForPost(
        postId,
        userId,
        likeStatus,
      );

      if (!updatedPost) {
        return res
          .status(httpStatuses.NOT_FOUND_404)
          .send({ message: "Post not found" });
      } else {
        return res.sendStatus(httpStatuses.NO_CONTENT_204);
      }
    } catch (error) {
      console.error("Ошибка при обновлении реакций:", error);
      return res
        .status(httpStatuses.INTERNAL_SERVER_ERROR_500)
        .send({ message: "Сервер на кофе-брейке!" });
    }
  }

  async deletePostById(req: RequestWithParams<getByIdParam>, res: Response) {
    const foundPost = await this.postsService.deletePost(req.params.id);
    if (!foundPost) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
}
