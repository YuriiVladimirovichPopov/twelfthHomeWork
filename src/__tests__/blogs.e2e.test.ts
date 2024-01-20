import request from "supertest";
import { app } from "../settings";
import { httpStatuses } from "../routers/helpers/send-status";
import { BlogViewModel } from "../models/blogs/blogsViewModel";
import { BlogInputModel } from "../models/blogs/blogsInputModel";
import { createBlog } from "./blog-test-helpers";
import { RouterPaths } from "../routerPaths";
import { BlogModel } from "../domain/schemas/blogs.schema";
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

  it("should return 200 and blog", async () => {
    await getRequest().get(RouterPaths.blogs).expect(httpStatuses.OK_200);
  });

  it("should return 404 for not existing blog", async () => {
    await getRequest()
      .get(`${RouterPaths.blogs}/999999999999999999999999`)
      .expect(httpStatuses.NOT_FOUND_404);
  });

  it("shouldn't create a new blog without auth", async () => {
    await getRequest()
      .post(RouterPaths.blogs)
      .send({})
      .expect(httpStatuses.UNAUTHORIZED_401);

    await getRequest()
      .post(RouterPaths.blogs)
      .auth("login", "password")
      .send({})
      .expect(httpStatuses.UNAUTHORIZED_401);
  });

  it("shouldn't create a new blog with incorrect input data", async () => {
    const data: BlogViewModel = {
      id: "",
      name: "",
      description: "",
      websiteUrl: "",
      createdAt: "",
      isMembership: false,
    };
    await getRequest()
      .post(RouterPaths.blogs)
      .send(data)
      .expect(httpStatuses.UNAUTHORIZED_401);

    await getRequest().get(RouterPaths.blogs).expect(httpStatuses.OK_200);
  });

  let createdBlog1: BlogViewModel;

  it("should create a new blog with correct input data", async () => {
    const countOfBlogsBefore = await BlogModel.countDocuments();
    expect(countOfBlogsBefore).toBe(0);
    const inputModel: BlogInputModel = {
      name: "new blog",
      description: "blabla",
      websiteUrl: "www.youtube.com",
    };

    const createResponse = await createBlog(inputModel);

    expect(createResponse.status).toBe(httpStatuses.CREATED_201);

    const createdBlog: BlogViewModel = createResponse.body;
    expect(createdBlog).toEqual({
      id: expect.any(String),
      name: inputModel.name,
      description: inputModel.description,
      websiteUrl: inputModel.websiteUrl,
      isMembership: false,
      createdAt: expect.any(String),
    });

    const countOfBlogsAfter = await BlogModel.countDocuments();
    expect(countOfBlogsAfter).toBe(1);

    const getByIdRes = await getRequest().get(
      `${RouterPaths.blogs}/${createdBlog.id}`,
    );

    expect(getByIdRes.status).toBe(httpStatuses.OK_200);
    expect(getByIdRes.body).toEqual(createdBlog);

    createdBlog1 = createdBlog;
    expect.setState({ blog1: createdBlog });
  });
  //let createdBlog2: BlogViewModel
  it("should create one more blog with correct input data", async () => {
    const inputModel: BlogInputModel = {
      name: "new blog",
      description: "blabla",
      websiteUrl: "www.youtube.com",
    };

    const createResponse = await createBlog(inputModel);

    expect.setState({ blog2: createResponse.body });
  });

  it("should get all posts fo specific blog", async () => {
    const { blog1 } = expect.getState();

    await getRequest()
      .get(`${RouterPaths.blogs}/${blog1.id}/posts`)
      .expect(httpStatuses.OK_200, {
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
  });

  it("shouldn't update a new blog with incorrect input data", async () => {
    const { blog1 } = expect.getState();

    const emptyData: BlogInputModel = {
      name: "",
      description: "",
      websiteUrl: "",
    };

    const errors = {
      errorsMessages: expect.arrayContaining([
        { message: expect.any(String), field: "name" },
        { message: expect.any(String), field: "description" },
        { message: expect.any(String), field: "websiteUrl" },
      ]),
    };

    const updateRes1 = await getRequest()
      .put(`${RouterPaths.blogs}/${blog1.id}`) // be blog1.id
      .auth("admin", "qwerty")
      .send({});

    expect(updateRes1.status).toBe(httpStatuses.BAD_REQUEST_400);
    expect(updateRes1.body).toStrictEqual(errors);

    const updateRes2 = await getRequest()
      .put(`${RouterPaths.blogs}/${blog1.id}`) // be blog1.id
      .auth("admin", "qwerty")
      .send(emptyData);

    expect(updateRes2.status).toBe(httpStatuses.BAD_REQUEST_400);
    expect(updateRes2.body).toStrictEqual(errors);
  });

  it("shouldn't update blog that not exist", async () => {
    const data: BlogViewModel = {
      id: "34456",
      name: "new blog",
      description: "blabla",
      websiteUrl: "www.youtube.com",
      createdAt: "30.06.2014",
      isMembership: false,
    };
    await getRequest()
      .put(`${RouterPaths.blogs}/${-234}`)
      .auth("admin", "qwerty")
      .send(data)
      .expect(httpStatuses.NOT_FOUND_404);
  });

  it("should update a new blog with correct input data", async () => {
    const { blog1 } = expect.getState();

    const inputModel: BlogInputModel = {
      name: "updated blog",
      description: "upd description",
      websiteUrl: "updwww.youtube.com",
    };

    await getRequest()
      .put(`${RouterPaths.blogs}/${blog1.id}`)
      .auth("admin", "qwerty")
      .send(inputModel)
      .expect(httpStatuses.NO_CONTENT_204);

    const updatedBlog = await getRequest().get(
      `${RouterPaths.blogs}/${blog1.id}`,
    );

    expect(updatedBlog.status).toBe(httpStatuses.OK_200);
    expect(updatedBlog.body).not.toBe(blog1);
    expect(updatedBlog.body).toEqual({
      id: blog1.id,
      name: inputModel.name,
      description: inputModel.description,
      websiteUrl: inputModel.websiteUrl,
      isMembership: blog1.isMembership,
      createdAt: blog1.createdAt,
    });
  });

  it("should delete both blogs", async () => {
    const { blog1, blog2 } = expect.getState();

    await getRequest()
      .delete(`${RouterPaths.blogs}/${blog1.id}`)
      .auth("admin", "qwerty")
      .expect(httpStatuses.NO_CONTENT_204);

    await getRequest()
      .get(`${RouterPaths.blogs}/${blog1.id}`)
      .expect(httpStatuses.NOT_FOUND_404);

    await getRequest()
      .delete(`${RouterPaths.blogs}/${blog2.id}`)
      .auth("admin", "qwerty")
      .expect(httpStatuses.NO_CONTENT_204);

    await getRequest()
      .get(`${RouterPaths.blogs}/${blog2.id}`)
      .expect(httpStatuses.NOT_FOUND_404);

    await getRequest().get(RouterPaths.blogs).expect(httpStatuses.OK_200, {
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });
});
