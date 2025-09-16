import express from "express";
import cors from "cors";
import { scanRouter } from "./src/routes/scan.js";
import teacherRouter from "./src/routes/teacher.js";
import { connectToDB } from "./src/config/connect-to-db.js";

connectToDB();

const app = express();

const PORT = 5000;

app.use(express.json());
app.use(cors());

app.use("/scan", scanRouter);
app.use("/teacher", teacherRouter);
app.get("/", (req, res) => {
  res.send("welcome to Pinequest backend");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
