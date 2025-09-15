import express from "express";
import cors from "cors";
import { helloRouter } from "./src/routes/hello.ts";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/hello", helloRouter);
app.get("/", (req, res) => {
  res.send("Hello TypeScript + Node.js!");
});
