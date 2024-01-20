import request from "supertest";
import { app } from "../settings";
import { httpStatuses } from "../routers/helpers/send-status";
import { body } from "express-validator";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const getRequest = () => {
  return request(app);
};

describe("tests for /comments", () => {
  const mongoURI = process.env.mongoUrl || `mongodb://0.0.0.0:27017`;
  //let postId
  beforeAll(async () => {
    console.log("Connect to db", mongoURI);

    await mongoose.connect(mongoURI);

    await getRequest().delete("/testing/all-data");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /* it("should return a list of comments for an existing post", async () => {
    const response = await request(app).get(`/posts/${postId}/comments`);

    // Проверяем, что HTTP-статус ответа - 200 OK
    expect(response.status).toBe(httpStatuses.OK_200);

    // Проверяем, что ответ - массив
    expect(Array.isArray(response.body)).toBeTruthy();

    // Если есть комментарии, проверяем структуру каждого из них
    response.body.forEach(comment => {
      expect(comment).toHaveProperty("id");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("commentatorInfo");
      expect(comment).toHaveProperty("createdAt");
      expect(comment).toHaveProperty("likesInfo");

      // Проверяем структуру информации о лайках
      expect(comment.likesInfo).toHaveProperty("likesCount");
      expect(comment.likesInfo).toHaveProperty("dislikesCount");

      // Дополнительные проверки...
    });
  }) */

  it("should return 404 when trying to get comments for a non-existent post", async () => {
    await getRequest()
      .get("/posts/nonExistentPostId/comments")
      .expect(httpStatuses.NOT_FOUND_404);
  });

  it("should return a list of comments when getting comments for an existing post", async () => {
    await getRequest()
      .get("/posts/:postId/comments")
      .expect(httpStatuses.NOT_FOUND_404);
    expect(body);
    expect.any(Array); //toEqual
  });

  it(`shouldn't update a comment for a non-existent post`, async () => {
    await getRequest().put("/posts/nonExistentPostId/comments").send({});
    expect(httpStatuses.NOT_FOUND_404);
  });

  it("should update a comment for an existing post", async () => {
    await getRequest().put("/posts/existingPostId/comments").send({});
    expect(httpStatuses.CREATED_201);
    expect(body).toEqual(expect.objectContaining({}));
  });

  it("should delete a comment", async () => {
    await request(app)
      .delete("/comments/commentId")
      .set("Authorization", "Bearer");
    expect(httpStatuses.NO_CONTENT_204);
  });
});
