import { body } from "express-validator";
import { inputValidationErrors } from "../input-validation-middleware";

const emailConfirmationValidation = body("email")
  .isString()
  .trim()
  .isEmail()
  .matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  .withMessage("incorrect email");
const recoveryCodeByEmail = body("email")
  .isString()
  .withMessage("must be a valid email")
  .trim()
  .isEmail();

export const emailConfValidation = [
  emailConfirmationValidation,
  inputValidationErrors,
];
export const emailWithRecoveryCodeValidation = [
  recoveryCodeByEmail,
  inputValidationErrors,
];
