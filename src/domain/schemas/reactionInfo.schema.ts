import mongoose from "mongoose";
import { LikeStatusType } from "../../models/reaction/reactionInfoViewModel";

export const userLoginValid = {
  minLength: 3,
  maxLength: 10,
};

export enum ReactionStatusEnum {
  None = "None",
  Like = "Like",
  Dislike = "Dislike",
}

export const ReactionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  parentId: { type: String, required: true },
  userId: { type: String, required: true }, //been type: String, required: true
  userLogin: {
    type: String,
    required: true,
    minLength: userLoginValid.minLength,
    maxLength: userLoginValid.maxLength,
  },
  myStatus: {
    type: String,
    required: true,
    enum: Object.values(ReactionStatusEnum)   //TODO: добавил default
  },
}, { _id: true, versionKey: false });   

export const ReactionModel = mongoose.model("reaction", ReactionSchema);



export const LikesInfoSchema = new mongoose.Schema(
  {
    likesCount: { type: Number, required: true },
    dislikesCount: { type: Number, required: true },
  },
  { _id: false });
  export const LikesInfoModel = mongoose.model("LikesInfo",LikesInfoSchema)


const LikeStatusSchema = new mongoose.Schema<LikeStatusType>({
  myStatus: {type: String, required: true}, 
  userId: {type:String, required: true},
  createdAt: {type: String, required: true}
})
export const LikeStatusModel = mongoose.model("LikeStatus", LikeStatusSchema)

