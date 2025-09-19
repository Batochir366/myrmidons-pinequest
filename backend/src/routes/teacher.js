import { Router } from "express";
import {
  createAttendance,
  createClassroom,
  endAttendance,
  getClassroomsByTeacherId,
  getOnlyClassroomsByTeacherId,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/classrooms/:teacherId", getClassroomsByTeacherId)
  .get("/only-classrooms/:teacherId", getOnlyClassroomsByTeacherId)
  .put("/end-classroom", endAttendance)
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance);

export default teacherRouter;
