import type { Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository.js";
import { parseWithSchema } from "../schemas/parse.js";
import {
  compiledCreateUserSchema,
  compiledUserPaginationSchema,
} from "../schemas/user.schema.js";

export class UserController {
  constructor(private readonly users: UserRepository) {}

  create = async (request: Request, response: Response): Promise<void> => {
    const input = parseWithSchema(compiledCreateUserSchema, request.body, "body");
    console.log('lol')
    const user = await this.users.create(input);
    response.status(201).json(user);
  };

  list = async (request: Request, response: Response): Promise<void> => {
    const pagination = parseWithSchema(
      compiledUserPaginationSchema,
      request.query,
      "query",
    );
    console.log('lolo')
    const users = await this.users.findAll(pagination);
    response.json(users);
  };
}
