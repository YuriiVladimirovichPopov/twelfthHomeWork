import { Router } from "express";
import {
  authorizationValidation,
  inputValidationErrors,
} from "../middlewares/input-validation-middleware";
import { createUserValidation } from "../middlewares/validations/users.validation";
import { userController } from "../composition-root";

export const usersRouter = Router({});

usersRouter.get("/", userController.getAllUsers.bind(userController));

usersRouter.post(
  "/",
  authorizationValidation,
  ...createUserValidation,
  inputValidationErrors,
  userController.createNewUser.bind(userController),
);

usersRouter.delete(
  "/:id",
  authorizationValidation,
  userController.deleteUserById.bind(userController),
);
