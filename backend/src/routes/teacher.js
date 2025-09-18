import {
  createAttendance,
  createClassroom,
  endAttendance,
  getClassroomsByTeacherId,
} from "../controllers/teacher.js";

const teacherRouter = Router();

teacherRouter
  .get("/:teacherId/classes", getClassroomsByTeacherId)
  .put("/end-classroom", endAttendance) 
  .post("/create-classroom", createClassroom)
  .post("/create-attendance", createAttendance);



export default teacherRouter;
