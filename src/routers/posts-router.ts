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
import { container, PostController } from "../composition-root";
import { guestAccessMiddleware } from "../middlewares/validations/guests.validation";



const postController = container.resolve<PostController>(PostController)

export const postsRouter = Router({});

postsRouter.put(   
  "/:postId/like-status",
  authMiddleware,
  postController.updateLikesDislikesForPost.bind(postController)
)

postsRouter.get(
  "/:postId/comments",
  guestAccessMiddleware,
  postController.getCommentsByPostId.bind(postController),
);

postsRouter.post(
  "/:postId/comments",
  authMiddleware,
  createPostValidationForComment,
  postController.createCommentsByPostId.bind(postController),
);

postsRouter.get("/", 
guestAccessMiddleware,
postController.getAllPosts.bind(postController));

postsRouter.post(
  "/",
  authorizationValidation,
  createPostValidation,
  postController.createPostByBlogId.bind(postController),
);

postsRouter.get("/:id", 
guestAccessMiddleware,
postController.getPostById.bind(postController));

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
