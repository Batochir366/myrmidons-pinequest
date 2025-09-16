import { Router } from "express";

import {
  createClassroom,
  getClassroomsByTeacher,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .post("/", createClassroom)
  .get("/teacher-classrooms/:teacherId", getClassroomsByTeacher);

export default teacherRouter;
