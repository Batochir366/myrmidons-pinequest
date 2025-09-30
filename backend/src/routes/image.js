import { Router } from "express";
import { getFaceImageByStudentId, saveFaceImage } from "../controllers/image.js";


const Imagerouter = Router();

Imagerouter.post("/save",saveFaceImage )
Imagerouter.get("/get/:studentId", getFaceImageByStudentId);


export default Imagerouter;
