import express from "express";
import cors from "cors";
import teacherRouter from "./src/routes/teacher.js";
import { connectToDB } from "./src/config/connect-to-db.js";
import studentRouter from "./src/routes/student.js";
import { attendanceRouter } from "./src/routes/attendance.js";

connectToDB();

const app = express();

const PORT = 5000;

app.use(express.json());
app.use(cors());

app.use("/teacher", teacherRouter);
app.use("/student", studentRouter);
app.use("/attendance", attendanceRouter);
app.get("/", (req, res) => {
  res.send("welcome to Pinequest backend");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
