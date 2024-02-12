import "reflect-metadata";
import { ObjectId } from "mongodb";
import { PaginatedType } from "../routers/helpers/pagination";
import { Paginated } from "../routers/helpers/pagination";
import { CommentsMongoDbType } from "../types";
import { CommentViewModel } from "../models/comments/commentViewModel";
import { CommentModel } from "../domain/schemas/comments.schema";
import {
  ReactionModel,
  ReactionStatusEnum,
} from "../domain/schemas/reactionInfo.schema";
import { injectable } from "inversify";

@injectable()
export class CommentsQueryRepository {
  constructor() {} 

  async getAllCommentsForPost(
    postId: string,
    pagination: PaginatedType,
    userId?: string,
  ): Promise<Paginated<CommentViewModel>> {
    const result = await CommentModel.find({ postId: postId })
      .sort({ [pagination.sortBy]: pagination.sortDirection })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    // Получаем все реакции текущего пользователя на комментарии этого поста
    const userReactions = await ReactionModel.find({
      parentId: { $in: result.map((comment) => comment._id) },
      userId,
    });

    const userReactionsMap = new Map(
      userReactions.map((reaction) => [
        reaction.parentId.toString(),
        reaction.myStatus,
      ]),
    );

    const mappedComments: CommentViewModel[] = result.map(
      (el: CommentsMongoDbType): CommentViewModel => ({
        id: el._id.toString(),
        content: el.content,
        commentatorInfo: el.commentatorInfo,
        createdAt: el.createdAt,
        likesInfo: {
          likesCount: el.likesInfo.likesCount,
          dislikesCount: el.likesInfo.dislikesCount,
          myStatus:
            userReactionsMap.get(el._id.toString()) || ReactionStatusEnum.None,
        },
      }),
    );

    const totalCount: number = await CommentModel.countDocuments({ postId });
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: Paginated<CommentViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };

    return response;
  }
  //В этом изменении мы сначала получаем все реакции пользователя (userId) на комментарии в посте (postId),
  //а затем создаем карту (Map),
  //связывающую ID комментария с соответствующим статусом реакции пользователя.
  //При формировании CommentViewModel, мы используем эту карту,
  //чтобы добавить правильный myStatus для каждого комментария.
  //Этот подход более эффективен, чем выполнять отдельный запрос к базе данных для каждого комментария.

  async findCommentById(
    id: string,
    userId?: string,
  ): Promise<CommentViewModel | null> {
    const comment: CommentsMongoDbType | null = await CommentModel.findOne({
      _id: new ObjectId(id),
    }).exec();

    if (!comment) return null;

    let myStatus: ReactionStatusEnum = ReactionStatusEnum.None;

    if (userId) {
      const reaction = await ReactionModel.findOne({
        userId: userId.toString(),
        parentId: id,
      }); 
     
      myStatus = reaction ? reaction.myStatus : ReactionStatusEnum.None; 
    }

    return {
      id: comment._id.toString(),
      commentatorInfo: comment.commentatorInfo,
      content: comment.content,
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus,
      },
    };
  }

  async findCommentsByParentId(
    parentId: string,
    pagination: PaginatedType,
    userId: string, 
  ): Promise<Paginated<CommentViewModel>> {
    const result = await CommentModel.find({ parentId: new ObjectId(parentId) })
      .sort({
        [pagination.sortBy]: pagination.sortDirection === "asc" ? 1 : -1,
      })
      .skip(pagination.skip)
      .limit(pagination.pageSize)
      .lean();

    // Получаем все реакции текущего пользователя на комментарии
    const userReactions = await ReactionModel.find({
      parentId: { $in: result.map((comment) => comment._id) },
      userId,
    });

    const userReactionsMap = new Map(
      userReactions.map((reaction) => [
        reaction.parentId.toString(),
        reaction.myStatus,
      ]),
    );

    const mappedComments: CommentViewModel[] = result.map(
      (comment: CommentsMongoDbType): CommentViewModel => ({
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: comment.commentatorInfo,
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus:
            userReactionsMap.get(comment._id.toString()) ||
            ReactionStatusEnum.None,
        },
      }),
    );

    const totalCount: number = await CommentModel.countDocuments({
      parentId: new ObjectId(parentId),
    });
    const pageCount: number = Math.ceil(totalCount / pagination.pageSize);

    const response: Paginated<CommentViewModel> = {
      pagesCount: pageCount,
      page: pagination.pageNumber,
      pageSize: pagination.pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };

    return response;
  }
  //  мы сначала извлекаем все комментарии,
  //затем получаем реакции пользователя на эти комментарии.
  //Создавая mappedComments, мы добавляем myStatus,
  //используя карту userReactionsMap,
  //которая связывает ID комментария с статусом реакции пользователя.
  //Если реакция не найдена, используется значение по умолчанию ReactionStatusEnum.None.
  //Это обеспечивает, что каждый комментарий в ответе будет содержать информацию о реакции пользователя.
}
