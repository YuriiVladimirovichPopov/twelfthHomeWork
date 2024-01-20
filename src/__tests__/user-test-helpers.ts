import request from "supertest";
import { app } from "../settings";
import { UserInputModel } from "../models/users/userInputModel";

//todo type in params

export const createUser = async (data: UserInputModel) => {
  return request(app).post("/users").auth("admin", "qwerty").send(data);
};
