import { Router } from "express";
import {
  addStudentToAttendance,
  checkStudentInClassroom,
  joinClassroom,
} from "../controllers/student.js";

const studentRouter = Router();

// Route to add a student to an attendance record
studentRouter.post("/attendance/add", addStudentToAttendance);

// Route for a student to join a classroom
studentRouter.put("/join/:classroomId", joinClassroom);
studentRouter.get("/check/:studentId ", checkStudentInClassroom);
studentRouter.get("/attendance ", addStudentToAttendance);

export default studentRouter;
