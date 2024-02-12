import { Router } from "express";
import { container, SecurityController } from "../composition-root";

const securityController =
  container.resolve<SecurityController>(SecurityController);

export const securityRouter = Router({});

securityRouter.get(
  "/devices",
  securityController.devices.bind(securityController),
);

securityRouter.delete(
  "/devices",
  securityController.deleteDevices.bind(securityController),
);

securityRouter.delete(
  "/devices/:deviceId",
  securityController.deleteDeviceById.bind(securityController),
);
