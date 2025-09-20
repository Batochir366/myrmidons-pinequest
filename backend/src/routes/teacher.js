import { Router } from "express";
import {
  createAttendance,
  createClassroom,
  endAttendance,
  getClassroomsAndStudentsByTeacherId,
  getClassroomsByTeacherId,
  getOnlyClassroomsByTeacherId,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/classrooms/:teacherId", getClassroomsByTeacherId)
  .get("/only-classrooms/:teacherId", getOnlyClassroomsByTeacherId)
  .get("/classrooms-and-students/:teacherId", getClassroomsAndStudentsByTeacherId)
  .put("/end-classroom", endAttendance)
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance);


export default teacherRouter;
