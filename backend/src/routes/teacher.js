import { Router } from "express";

import  {
  createClassroom,
  endClassroom,
  getTeacherWithClasses,
  
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/get/:teacherId", getTeacherWithClasses)
  .put("/end-classroom", endClassroom)
  .post("/create", createClassroom)


export default teacherRouter;
