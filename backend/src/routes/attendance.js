import { Router } from "express";
import {
  checkStudentAttendance,
  endAttendance,
  getAttendanceById,
  getClassroomAttendanceHistoryById,
  getClassroomById,
  getLiveAttendance,
} from "../controllers/attendance.js";

export const attendanceRouter = Router();

attendanceRouter
  .get("/:attendanceId", getAttendanceById)
  .get("/classroom/:classroomId", getClassroomAttendanceHistoryById)
  .get("/only/:classroomId", getClassroomById)
  .get("/check/:attendanceId/:studentId", checkStudentAttendance)
  .get("/live/:attendanceId", getLiveAttendance)
  .put("/end", endAttendance);
