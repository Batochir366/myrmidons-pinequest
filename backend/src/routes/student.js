import { addStudentToAttendance } from "../controllers/student.js";
import { Router } from "express";
const studentRouter = Router();



studentRouter.post("/add", addStudentToAttendance);

export default studentRouter;