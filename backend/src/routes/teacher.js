import {
  createAttendance,
  createClassroom,
  endAttendance,
  getTeacherWithClasses,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/get/:teacherId", getTeacherWithClasses)
  .put("/end-classroom", endAttendance) 
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance);



export default teacherRouter;
