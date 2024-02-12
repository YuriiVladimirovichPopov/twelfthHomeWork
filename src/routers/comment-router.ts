import { Router } from "express";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { createPostValidationForComment } from "../middlewares/validations/comments.validation";
import { CommentController, container } from "../composition-root";
import { LikeStatusValidation } from "../middlewares/validations/reaction.validation";
import { inputValidationErrors } from "../middlewares/input-validation-middleware";
import { guestAccessMiddleware } from "../middlewares/validations/guests.validation";

const commentController =
  container.resolve<CommentController>(CommentController);

export const commentsRouter = Router({});

commentsRouter.get(
  "/:commentId",
  guestAccessMiddleware,
  commentController.getCommentById.bind(commentController),
);

commentsRouter.put(
  "/:commentId",
  authMiddleware,
  createPostValidationForComment,
  commentController.changeCommentReaction.bind(commentController),
);
commentsRouter.put(
  "/:commentId/like-status",
  authMiddleware,
  LikeStatusValidation,
  inputValidationErrors,
  commentController.updateLikesDislikes.bind(commentController),
);

commentsRouter.delete(
  "/:commentId",
  authMiddleware,
  commentController.deleteCommentById.bind(commentController),
);
