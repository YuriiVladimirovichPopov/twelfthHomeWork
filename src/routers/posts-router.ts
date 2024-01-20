import { Router } from "express";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import {
  createPostValidation,
  updatePostValidation,
} from "../middlewares/validations/posts.validation";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { createPostValidationForComment } from "../middlewares/validations/comments.validation";
import { postController } from "../composition-root";
import { userValidationMiddleware } from "../middlewares/validations/user.id.validation";
import { guestAccessMiddleware } from "../middlewares/validations/guests.validation";

export const postsRouter = Router({});

postsRouter.get(
  "/:postId/comments",
  guestAccessMiddleware,
  postController.getCommentsByPostId.bind(postController),
);

postsRouter.post(
  "/:postId/comments",
  authMiddleware,
  //userValidationMiddleware,
  createPostValidationForComment,
  postController.createCommentsByPostId.bind(postController),
);

postsRouter.get("/", postController.getAllPosts.bind(postController));

postsRouter.post(
  "/",
  authorizationValidation,
  createPostValidation,
  postController.createPostByBlogId.bind(postController),
);

postsRouter.get("/:id", postController.getPostById.bind(postController));

postsRouter.put(
  "/:id",
  authorizationValidation,
  updatePostValidation,
  postController.updatePostById.bind(postController),
);

postsRouter.delete(
  "/:id",
  authorizationValidation,
  inputValidationErrors,
  postController.deletePostById.bind(postController),
);
