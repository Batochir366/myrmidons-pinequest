import { Router } from "express";
import { createClassRoom } from "../controllers/teacherController.js";

const teacherRouter = Router();

teacherRouter.post("/", createClassRoom);

export default teacherRouter;
