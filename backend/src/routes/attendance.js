import { Router } from "express";
import {
  getAttendanceById,
  getClassroomAttendanceHistoryById,
} from "../controllers/attendance.js";

export const attendanceRouter = Router();

attendanceRouter
  .get("/:attendanceId", getAttendanceById)
  .get("/classroom/:classroomId", getClassroomAttendanceHistoryById);
