import express from "express";
import cors from "cors";
import { scanRouter } from "./src/routes/scan.js";
import teacherRouter from "./src/routes/teacher.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/scan", scanRouter);
app.use("/teacher", teacherRouter);
app.get("/", (req, res) => {
  res.send("Hello js + Node.js!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
