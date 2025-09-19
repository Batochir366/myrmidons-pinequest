import { Router } from "express";
import {
  addStudentToAttendance,
  checkStudentInClassroom,
  joinClassroom,
} from "../controllers/student.js";

const studentRouter = Router();

// Route to add a student to an attendance record
studentRouter.post("/add", addStudentToAttendance);
studentRouter.put("/join/:classroomId", joinClassroom);
studentRouter.get("/check/:studentId", checkStudentInClassroom);

export default studentRouter;
