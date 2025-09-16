import { Router } from "express";

import getTeacher, {
  createClassroom,
  createTeacher,
  teacherLogin,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .post("/create-classroom", createClassroom)
  .get("/get/:teacherId", getTeacher)
  .post("/sign-up", createTeacher)
  .post("/login", teacherLogin);

export default teacherRouter;
