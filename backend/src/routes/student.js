import { Router } from "express";
import {
  addStudentToAttendance,
  joinClassroom,
  joinClassroomByCode,
} from "../controllers/student.js";

const studentRouter = Router();

// Route to add a student to an attendance record
studentRouter.put("/add", addStudentToAttendance);
studentRouter.put("/join/:classroomId", joinClassroom);
studentRouter.put("/joinbycode", joinClassroomByCode);

export default studentRouter;
