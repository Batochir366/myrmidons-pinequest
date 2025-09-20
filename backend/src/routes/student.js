import { Router } from "express";
import {
  addStudentToAttendance,
  joinClassroom,
} from "../controllers/student.js";

const studentRouter = Router();

// Route to add a student to an attendance record
studentRouter.post("/add", addStudentToAttendance);
studentRouter.put("/join/:classroomId", joinClassroom);

export default studentRouter;
