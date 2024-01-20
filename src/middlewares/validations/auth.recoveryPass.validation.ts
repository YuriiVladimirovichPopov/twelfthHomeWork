import { body } from "express-validator";
import { inputValidationErrors } from "../input-validation-middleware";

export const recoveryCodeValidation = body("recoveryCode")
  .isString()
  .withMessage("Must be string")
  .trim();
export const newPasswordValidation = body("newPassword")
  .isString()
  .withMessage("Must be string")
  .trim()
  .isLength({ min: 6, max: 20 })
  .withMessage("Length must be from 6 to 20 simbols");

export const forCreateNewPasswordValidation = [
  newPasswordValidation,
  recoveryCodeValidation,
  inputValidationErrors,
];
