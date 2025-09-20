import { Router } from "express";
import {
  getAttendanceById,
  getClassroomAttendanceHistoryById,
  getClassroomById,
} from "../controllers/attendance.js";

export const attendanceRouter = Router();

attendanceRouter
  .get("/:attendanceId", getAttendanceById)
  .get("/classroom/:classroomId", getClassroomAttendanceHistoryById)
  .get("/:classroomId", getClassroomById);
