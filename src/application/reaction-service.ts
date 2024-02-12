import "reflect-metadata";
import { injectable } from "inversify";
import { ReactionStatusEnum } from "../domain/schemas/reactionInfo.schema";
import { ReactionModel } from "../domain/schemas/reactionInfo.schema";
import { ReactionsRepository } from "../repositories/reaction-repository";
import { ReactionMongoDb } from "../types";

@injectable()
export class ReactionsService {
  constructor(private reactionRepository: ReactionsRepository) {}

  async addReaction(
    userId: string,
    parentId: string,
    userLogin: string,
    reactionStatus: ReactionStatusEnum,
  ) {
    const existingReaction =
      await this.reactionRepository.findByParentAndUserIds(parentId, userId);
    if (existingReaction) {
      throw new Error(
        "Reaction already exists. Use update method to change the reaction.",
      );
    }

    const reactionData = {
      parentId,
      userId,
      userLogin,
      myStatus: reactionStatus,
      createdAt: new Date(),
      updatedAt: false,
    };

    return await this.reactionRepository.createReaction(reactionData);
  }

  async updateReactionByParentId(
    parentId: string,
    userId: string,
    reactionStatus: ReactionStatusEnum,
  ) {
    const reaction = await this.reactionRepository.findByParentAndUserIds(
      parentId,
      userId,
    );

    if (!reaction) {
      throw new Error(
        "Reaction not found. Use add method to create a new reaction.",
      );
    }

    const updatedReactionData = {
      ...reaction.toObject(),
      myStatus: reactionStatus,
      createdAt: new Date(),
      updatedAt: true,
      userId: reaction.userId.toString(),
    };

    await this.reactionRepository.updateReactionByParentId(updatedReactionData);

    return updatedReactionData;
  }

  async getReactionsForParentId(parentId: string): Promise<ReactionMongoDb[]> {
    const reactions = await ReactionModel.find({ parentId }).exec();
    return reactions.map((reaction) => reaction.toObject() as ReactionMongoDb);
  }
}
