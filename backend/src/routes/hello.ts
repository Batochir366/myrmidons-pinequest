import { Router } from "express";
import { helloController } from "../controllers/hello.ts";

const HelloRouter = Router();

export const helloRouter = HelloRouter.get("/", helloController as any);
