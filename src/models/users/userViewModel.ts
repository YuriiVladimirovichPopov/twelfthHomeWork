import { EmailConfirmationType } from "../../types";

export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  emailConfirmation: EmailConfirmationType;
  recoveryCode: string;
};
