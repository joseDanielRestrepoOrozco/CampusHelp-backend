import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { UserRepository } from "../repositories/user.repository.js";

const repository = new UserRepository();
const controller = new UserController(repository);

export const userRouter = Router();

userRouter.post("/", controller.create);
userRouter.get("/", controller.list);
