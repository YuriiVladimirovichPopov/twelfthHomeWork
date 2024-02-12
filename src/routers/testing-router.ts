import { Router } from "express";
import { container, TestController } from "../composition-root";

const testController = container.resolve<TestController>(TestController);

export const testingRouter = Router({});

testingRouter.delete("/all-data", testController.allData.bind(testController));
