import express from "express";
import cors from "cors";
import { helloRouter } from "./src/routes/hello.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use("/hello", helloRouter);
app.get("/", (req, res) => {
  res.send("Hello js + Node.js!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
