import { Router } from "express";

import  {
  createClassroom,
  endClassroom,
  getTeacherWithClasses,
  
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .post("/create-classroom", createClassroom)
  .get("/get/:teacherId", getTeacherWithClasses)
  .put("/end-classroom", endClassroom);

export default teacherRouter;
