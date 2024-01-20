import request from "supertest";
import { app } from "../settings";
import { httpStatuses } from "../routers/helpers/send-status";
import { PostsViewModel } from "../models/posts/postsViewModel";
import { PostsInputModel } from "../models/posts/postsInputModel";
import { RouterPaths } from "../routerPaths";
import { BlogInputModel } from "../models/blogs/blogsInputModel";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const getRequest = () => {
  return request(app);
};

let connection: any;
let db;

describe("tests for /blogs", () => {
  const mongoURI = process.env.mongoUrl || `mongodb://0.0.0.0:27017`;

  beforeAll(async () => {
    console.log("Connect to db", mongoURI);

    await mongoose.connect(mongoURI);

    await getRequest().delete("/testing/all-data");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 200 and post", async () => {
    await getRequest().get("/blogs").expect(httpStatuses.OK_200);
  });

  it("should return 404 for not existing post", async () => {
    await getRequest()
      .get("/posts/999999999999999999999999")
      .expect(httpStatuses.NOT_FOUND_404);
  });

  it("shouldn't create a new post with incorrect input data", async () => {
    const data: PostsViewModel = {
      id: "",
      title: "",
      shortDescription: "",
      content: "",
      blogId: "",
      blogName: "",
      createdAt: "",
    };
    await getRequest()
      .post("/posts")
      .send(data)
      .expect(httpStatuses.UNAUTHORIZED_401);
  });

  it("should create a new post with correct input data", async () => {
    const blog: BlogInputModel = {
      name: "newName",
      description: "blablabla1",
      websiteUrl: "it-incubator.com",
    };
    const createResponse = await getRequest()
      .post("/blogs")
      .auth("admin", "qwerty")
      .send(blog)
      .expect(httpStatuses.CREATED_201);

    const createdPost: PostsInputModel = {
      title: "new blog",
      shortDescription: "blabla",
      content: "i love you",
      blogId: createResponse.body.id,
    };
    const resPost = await getRequest()
      .post("/posts")
      .auth("admin", "qwerty")
      .send(createdPost)
      .expect(httpStatuses.CREATED_201);

    expect.setState({ post1: resPost.body, blog1: createResponse.body });
  });

  it("shouldn't update post with incorrent input data", async () => {
    const { post1 } = expect.getState();

    const emptyData: PostsInputModel = {
      title: "",
      shortDescription: "",
      content: "",
      blogId: "",
    };

    const errors = {
      errorsMessages: expect.arrayContaining([
        { message: expect.any(String), field: "title" },
        { message: expect.any(String), field: "shortDescription" },
        { message: expect.any(String), field: "content" },
        { message: expect.any(String), field: "blogId" },
      ]),
    };

    const updateRes1 = await getRequest()
      .put(`${RouterPaths.posts}/${post1}`)
      .auth("admin", "qwerty")
      .send({});

    expect(updateRes1.status).toBe(httpStatuses.BAD_REQUEST_400);
    expect(updateRes1.body).toStrictEqual(errors);

    const updateRes2 = await getRequest()
      .put(`${RouterPaths.posts}/${post1}`)
      .auth("admin", "qwerty")
      .send(emptyData);

    expect(updateRes2.status).toBe(httpStatuses.BAD_REQUEST_400);
    expect(updateRes2.body).toStrictEqual(errors);
  });

  it("should update post with corrent input data", async () => {
    const { post1, blog1 } = expect.getState();

    const inputModel: PostsInputModel = {
      title: "updated title",
      shortDescription: "updated shortDescription",
      content: "updated content",
      blogId: blog1.id,
    };

    await getRequest()
      .put(`${RouterPaths.posts}/${post1.id}`)
      .auth("admin", "qwerty")
      .send(inputModel)
      .expect(httpStatuses.NO_CONTENT_204);

    const updatedPost = await getRequest().get(
      `${RouterPaths.posts}/${post1.id}`,
    );

    expect(updatedPost.status).toBe(httpStatuses.OK_200);
    expect(updatedPost.body).not.toBe(post1);
    expect(updatedPost.body).toEqual({
      id: post1.id,
      title: inputModel.title,
      shortDescription: inputModel.shortDescription,
      content: inputModel.content,
      blogId: blog1.id,
      blogName: post1.blogName,
      createdAt: post1.createdAt,
    });
  });

  it("should delete post with corrent input data", async () => {
    const { post1 } = expect.getState();

    await getRequest()
      .delete(`${RouterPaths.posts}/${post1.id}`)
      .auth("admin", "qwerty")
      .expect(httpStatuses.NO_CONTENT_204);

    await getRequest()
      .get(`${RouterPaths.blogs}/${post1.id}`)
      .expect(httpStatuses.NOT_FOUND_404);

    await getRequest().get(RouterPaths.posts).expect(httpStatuses.OK_200, {
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });
});
