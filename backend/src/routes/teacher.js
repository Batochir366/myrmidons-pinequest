import { Router } from "express";
import {
  createAttendance,
  createClassroom,
  deleteClassroom,
  getClassroomsAndStudentsByTeacherId,
  getClassroomsByTeacherId,
  getOnlyClassroomsByTeacherId,
  getStudentsByClassroomId,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/classrooms/:teacherId", getClassroomsByTeacherId)
  .get("/only-classrooms/:teacherId", getOnlyClassroomsByTeacherId)
  .get(
    "/classrooms-and-students/:teacherId",
    getClassroomsAndStudentsByTeacherId
  )
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance)
  .get("/classroom-students/:classroomId", getStudentsByClassroomId)
  .delete("/delete-classroom/:classroomId", deleteClassroom);

export default teacherRouter;
