import { addStudentToAttendance } from "../controllers/student.js";
import { Router } from "express";
const attendancerouter = Router();



attendancerouter.post("/add", addStudentToAttendance);

export default attendancerouter;