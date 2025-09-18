import { Router } from "express";
import { addStudentToAttendance } from "../controllers/student.js";
const studentRouter = Router();

studentRouter.post("/add", addStudentToAttendance);

export default studentRouter;
