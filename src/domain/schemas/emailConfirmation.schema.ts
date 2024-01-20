import mongoose from "mongoose";
import { EmailConfirmationType } from "../../types";

export const EmailConfirmationSchema =
  new mongoose.Schema<EmailConfirmationType>({
    isConfirmed: { type: Boolean, required: true },
    confirmationCode: { type: String, required: true },
    expirationDate: { type: Date, required: true },
  });
