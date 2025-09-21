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
const allowedOrigins = [
  "http://localhost:3000",
  "https://myrmidons-pinequest-frontend-delta.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/teacher", teacherRouter);
app.use("/student", studentRouter);
app.use("/attendance", attendanceRouter);
app.get("/", (req, res) => {
  res.send("welcome to Pinequest backend");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
