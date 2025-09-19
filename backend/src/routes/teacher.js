import { Router } from "express";
import {
  createAttendance,
  createClassroom,
  endAttendance,
  getAttendanceStats,
  getAttendingStudents,
  getClassroomAttendanceHistory,
  getClassroomsByTeacherId,
  getCurrentAttendance,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/:teacherId/classes", getClassroomsByTeacherId)
  .put("/end-classroom", endAttendance)
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance)
  .get("/attendance/:attendanceId/students", getAttendingStudents)
  .get("/classroom/:classroomId/current-attendance", getCurrentAttendance)
  .get(
    "/classroom/:classroomId/attendance-history",
    getClassroomAttendanceHistory
  )
  .get("/classroom/:classroomId/attendance-stats", getAttendanceStats);

export default teacherRouter;
