import "reflect-metadata";
import { injectable } from "inversify";
import {
  ReactionModel,
  ReactionStatusEnum,
} from "../domain/schemas/reactionInfo.schema";
import { ObjectId } from "mongodb";

interface ReactionData {
  parentId: string;
  userId: string;
  userLogin: string;
  myStatus: ReactionStatusEnum;
  createdAt: Date;
  updatedAt: boolean;
}

@injectable()
export class ReactionsRepository {
  constructor() {}

  async findByParentAndUserIds(parentId: string, userId: string) {
    return await ReactionModel.findOne({
      parentId: parentId,
      userId: userId,
    });
  }

  async createReaction(reactionData: ReactionData) {
    const reaction = new ReactionModel(reactionData);
    await reaction.save();
    return reaction;
  }

  async updateReactionByParentId(newReaction: ReactionData) {
    return await ReactionModel.updateOne(
      {
        parentId: newReaction.parentId,
        userId: new ObjectId(newReaction.userId),
      },
      { $set: newReaction },
      { new: true },
    );
  }
}
