import { Router } from "express";
import { scanQR } from "../controllers/scan.js";

export const scanRouter = Router();

scanRouter.get("/", scanQR);
