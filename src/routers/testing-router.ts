import { Router } from "express";
import { testController } from "../composition-root";

export const testingRouter = Router({});

testingRouter.delete("/all-data", testController.allData.bind(testController));
