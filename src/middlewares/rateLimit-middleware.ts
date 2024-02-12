import { Request, Response, NextFunction } from "express";
import { RateLimitMongoDbType } from "../types";
import { httpStatuses } from "../routers/helpers/send-status";
import { RateLimitModel } from "../domain/schemas/rateLimit.schema";

const maxRequests = 5;
const interval = 10 * 1000;
const connections: RateLimitMongoDbType[] = [];

export async function customRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const IP = req.ip || "";
  const URL = req.url;
  const date = new Date();

  if (URL === undefined) {
    // Обработка случая, когда URL === undefined
    return res.sendStatus(httpStatuses.INTERNAL_SERVER_ERROR_500);
  }

  try {
    const count = await RateLimitModel.countDocuments({
      IP: IP,
      URL: URL,
      date: { $gte: new Date(+date - interval) }, // +date === integer
    });
    //const count = connections.filter(c => c.IP === IP && c.URL === URL && c.date >= new Date(+date - interval)).length

    if (count + 1 > maxRequests) {
      return res.sendStatus(httpStatuses.TOO_MANY_REQUESTS_429);
    }
    await RateLimitModel.insertMany({ IP: IP, URL: URL, date: date });
    connections.push({ IP, URL, date });
    next();
  } catch (err) {
    res.sendStatus(httpStatuses.INTERNAL_SERVER_ERROR_500);
  }
}
