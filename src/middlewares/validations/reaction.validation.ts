import { body } from "express-validator";
import { ReactionStatusEnum } from "../../domain/schemas/reactionInfo.schema";

export const LikeStatusValidation = body("likeStatus").custom((val) =>
  Object.keys(ReactionStatusEnum).includes(val),
);
