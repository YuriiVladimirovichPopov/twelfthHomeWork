import "reflect-metadata";
import { Response, Request } from "express";
import { getByIdParam } from "../models/getById";
import { UserViewModel } from "../models/users/userViewModel";
import { UsersRepository } from "../repositories/users-repository";
import {
  getUsersPagination,
  PaginatedType,
  Paginated,
} from "../routers/helpers/pagination";
import { httpStatuses } from "../routers/helpers/send-status";
import { RequestWithParams } from "../types";
import { AuthService } from "../composition-root";
import { injectable } from "inversify";

@injectable()
export class UserController {
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
  ) {}

  async getAllUsers(req: Request, res: Response) {
    const pagination = getUsersPagination(
      req.query as unknown as PaginatedType, // TODO bad solution
    );
    const allUsers: Paginated<UserViewModel> =
      await this.usersRepository.findAllUsers(pagination);

    return res.status(httpStatuses.OK_200).send(allUsers);
  }

  async createNewUser(req: Request, res: Response) {
    const newUser = await this.authService.createUser(
      req.body.login,
      req.body.email,
      req.body.password,
    );
    if (!newUser) {
      return res.sendStatus(httpStatuses.UNAUTHORIZED_401);
    }
    return res.status(httpStatuses.CREATED_201).send(newUser);
  }

  async deleteUserById(req: RequestWithParams<getByIdParam>, res: Response) {
    const foundUser = await this.usersRepository.deleteUserById(req.params.id);
    if (!foundUser) {
      return res.sendStatus(httpStatuses.NOT_FOUND_404);
    }
    return res.sendStatus(httpStatuses.NO_CONTENT_204);
  }
}
