import { Router } from "express";
import { addStudentToAttendance, joinClassroom } from "../controllers/student.js";

const studentRouter = Router();

// Route to add a student to an attendance record
studentRouter.post("/attendance/add", addStudentToAttendance);

// Route for a student to join a classroom
studentRouter.put("/classroom/join/:classroomId", joinClassroom);

export default studentRouter;
