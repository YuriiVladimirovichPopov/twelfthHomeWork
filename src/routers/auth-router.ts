import { Router } from "express";
import { authMiddleware } from "../middlewares/validations/auth.validation";
import { validateCode } from "../middlewares/validations/code.validation";
import {
  emailConfValidation,
  emailWithRecoveryCodeValidation,
} from "../middlewares/validations/emailConf.validation";
import { createUserValidation } from "../middlewares/validations/users.validation";
import { customRateLimit } from "../middlewares/rateLimit-middleware";
import { forCreateNewPasswordValidation } from "../middlewares/validations/auth.recoveryPass.validation";
import { refTokenMiddleware } from "../middlewares/validations/refToken.validation";
import { AuthController, container } from "../composition-root";

const authController = container.resolve<AuthController>(AuthController);

export const authRouter = Router({});

authRouter.post(
  "/login",
  customRateLimit,
  authController.login.bind(authController),
);

authRouter.post(
  "/password-recovery",
  emailWithRecoveryCodeValidation,
  customRateLimit,
  authController.passwordRecovery.bind(authController),
);

authRouter.post(
  "/new-password",
  forCreateNewPasswordValidation,
  customRateLimit,
  authController.newPassword.bind(authController),
);

authRouter.get("/me", authMiddleware, authController.me.bind(authController));

authRouter.post(
  "/registration-confirmation",
  customRateLimit,
  validateCode,
  authController.registrationConfirmation.bind(authController),
);

authRouter.post(
  "/registration",
  customRateLimit,
  createUserValidation,
  authController.registration.bind(authController),
);

authRouter.post(
  "/registration-email-resending",
  customRateLimit,
  emailConfValidation,
  authController.registrationEmailResending.bind(authController),
);

authRouter.post(
  "/refresh-token",
  refTokenMiddleware,
  authController.refreshToken.bind(authController),
);

authRouter.post(
  "/logout",
  refTokenMiddleware,
  authController.logOut.bind(authController),
);
