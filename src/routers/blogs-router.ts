import "reflect-metadata";
import { Router } from "express";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import {
  createBlogValidation,
  updateBlogValidation,
} from "../middlewares/validations/blogs.validation";
import { createPostValidationForBlogRouter } from "../middlewares/validations/posts.validation";
import { BlogsController, container } from "../composition-root";
import { guestAccessMiddleware } from "../middlewares/validations/guests.validation";

const blogsController = container.resolve<BlogsController>(BlogsController);

export const blogsRouter = Router({});

blogsRouter.get("/", blogsController.getAllBlogs.bind(blogsController));
blogsRouter.post(
  "/",
  authorizationValidation,
  ...createBlogValidation,
  blogsController.createBlogs.bind(blogsController),
);

blogsRouter.get(
  "/:blogId/posts",
  guestAccessMiddleware,
  blogsController.getPostByBlogId.bind(blogsController),
);

blogsRouter.post(
  "/:blogId/posts",
  authorizationValidation,
  createPostValidationForBlogRouter,
  blogsController.createPostForBlogById.bind(blogsController),
);

blogsRouter.get("/:id", blogsController.getBlogById.bind(blogsController));

blogsRouter.put(
  "/:id",
  authorizationValidation,
  ...updateBlogValidation,
  blogsController.updateBlogById.bind(blogsController),
);

blogsRouter.delete(
  "/:id",
  authorizationValidation,
  inputValidationErrors,
  blogsController.deleteBlogById.bind(blogsController),
);
