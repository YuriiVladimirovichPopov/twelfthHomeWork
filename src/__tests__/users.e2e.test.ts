import request from "supertest";
import { app } from "../settings";
import { httpStatuses } from "../routers/helpers/send-status";
import { UserViewModel } from "../models/users/userViewModel";
import { UserInputModel } from "../models/users/userInputModel";
import { createUser } from "../__tests__/user-test-helpers";
import { UserModel } from "../domain/schemas/users.schema";
import { RouterPaths } from "../routerPaths";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const getRequest = () => {
  return request(app);
};
let connection: any;
let db;

describe("tests for /users", () => {
  const mongoURI = process.env.mongoUrl || `mongodb://0.0.0.0:27017`;

  beforeAll(async () => {
    console.log("Connect to db", mongoURI);

    await mongoose.connect(mongoURI);

    await getRequest().delete("/testing/all-data");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 200 and user", async () => {
    await getRequest().get(RouterPaths.users).expect(httpStatuses.OK_200);
  });

  it("should return 404 for not existing user", async () => {
    await getRequest()
      .get(`${RouterPaths.users}/999999`)
      .expect(httpStatuses.NOT_FOUND_404);
  });

  it("shouldn't create a new user without auth", async () => {
    await getRequest()
      .post(RouterPaths.users)
      .send({})
      .expect(httpStatuses.UNAUTHORIZED_401);

    await getRequest()
      .post(RouterPaths.users)
      .auth("login", "password")
      .send({})
      .expect(httpStatuses.UNAUTHORIZED_401);
  });

  it("shouldn't create a new user with incorrect input data", async () => {
    const data: UserViewModel = {
      id: "",
      login: "",
      email: "",
      createdAt: "",
      emailConfirmation: {
        isConfirmed: false,
        confirmationCode: " ",
        expirationDate: new Date(),
      },
      recoveryCode: "",
    };

    await getRequest()
      .post(RouterPaths.users)
      .send(data)
      .expect(httpStatuses.UNAUTHORIZED_401);

    await getRequest().get(RouterPaths.users).expect(httpStatuses.OK_200);
  });

  it("should create a new user with correct input data", async () => {
    const countOfUsersBefore = await UserModel.countDocuments();
    expect(countOfUsersBefore).toBe(0);
    const inputModel: UserInputModel = {
      id: "userId1",
      login: "new user1",
      email: "blabla@email.com",
      password: "www.youtube.com",
    };

    const createResponse = await createUser(inputModel);

    const createdUser: UserInputModel = createResponse.body;
    expect(createdUser).toEqual({
      id: expect.any(String),
      login: inputModel.login,
      email: inputModel.email,
      createdAt: expect.any(String), //так лучше
    });

    expect(createResponse.status).toBe(httpStatuses.CREATED_201);

    const countOfUsersAfter = await UserModel.countDocuments();
    expect(countOfUsersAfter).toBe(1);

    expect.setState({ user1: createResponse.body });
  });

  it("should create one more user with correct input data", async () => {
    const inputModel: UserInputModel = {
      id: "userId2",
      login: "new user2",
      email: "newuser@example.com",
      password: "new user pass",
    };

    const createResponse = await createUser(inputModel);

    expect.setState({ user2: createResponse.body });
  });

  it("should delete both users", async () => {
    const { user1, user2 } = expect.getState();

    await getRequest()
      .delete(`${RouterPaths.users}/${user1.id}`)
      .auth("admin", "qwerty")
      .expect(httpStatuses.NO_CONTENT_204);

    await getRequest()
      .delete(`${RouterPaths.users}/${user2.id}`)
      .auth("admin", "qwerty")
      .expect(httpStatuses.NO_CONTENT_204);
  });
});
