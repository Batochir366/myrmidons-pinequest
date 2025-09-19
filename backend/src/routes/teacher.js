import { Router } from "express";
import {
  createAttendance,
  createClassroom,
  endAttendance,
  getClassroomsByTeacherId,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/classrooms/:teacherId", getClassroomsByTeacherId)
  .put("/end-classroom", endAttendance)
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance);

export default teacherRouter;
