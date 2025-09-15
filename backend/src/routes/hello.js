import { Router } from "express";
import { helloController } from "../controllers/hello.js";

const HelloRouter = Router();

export const helloRouter = HelloRouter.get("/", helloController);
