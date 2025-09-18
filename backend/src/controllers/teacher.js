import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { TeacherModel } from "../models/teacher.model.js";
import jwt from "jsonwebtoken";

const SECRET_KEY = "pinequest-secret";

export const createClassroom = async (req, res) => {
  try {
    const { lectureName, teacherId } = req.body;

    if (!lectureName || !teacherId) {
      return res
        .status(400)
        .json({ message: "lectureName болон teacherId шаардлагатай" });
    }

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Багш олдсонгүй" });
    }

    const newClassroom = new ClassroomModel({
      lectureName,
      teacher: teacherId,
      ClassroomStudents: [],
      attendanceHistory: [],
    });

    const savedClassroom = await newClassroom.save();

    const tokenPayload = {
      classroomId: savedClassroom._id,
      lectureName,
      teacherName: teacher.teacherName,
    };

    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "30d" });

    const joinLink = `https://myrmidons-pinequest-frontend.vercel.app/join?token=${token}`;

    savedClassroom.joinLink = joinLink;
    await savedClassroom.save();

    await TeacherModel.findByIdAndUpdate(teacherId, {
      $addToSet: { Classrooms: savedClassroom._id },
    });

    return res.status(201).json({
      message: "Ангийг амжилттай үүсгэлээ",
      classroom: savedClassroom,
      joinLink,
    });
  } catch (error) {
    console.error("❌ createClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getClassroomsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const classrooms = await ClassroomModel.find({ teacher: teacherId });

    return res.status(200).json({ classrooms });
  } catch (error) {
    console.error("❌ getClassroomsByTeacherId error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

//Attendance controllers

export const createAttendance = async (req, res) => {
  try {
    const { classroomId } = req.body;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId is required" });
    }

    // Check classroom exists (optional but recommended)
    const classroom = await ClassroomModel.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Create new attendance linked to this classroom
    const newAttendance = await AttendanceModel.create({
      classroom: classroomId,
      attendingStudents: [],
      endedAt: null,
    });

    // Update Classroom attendanceHistory array
    await ClassroomModel.findByIdAndUpdate(classroomId, {
      $push: { attendanceHistory: newAttendance._id },
    });

    res.status(201).json(newAttendance);
  } catch (error) {
    console.error("❌ createAttendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const endAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.body;

    if (!attendanceId) {
      return res.status(400).json({ message: "Classroom ID is required" });
    }

    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(
      attendanceId,
      { endedAt: new Date() },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    return res
      .status(200)
      .json({ message: "Classroom ended", classroom: updatedAttendance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};
