import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { TeacherModel } from "../models/teacher.model.js";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import crypto from "crypto";

const generateJoinCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
configDotenv();

const SECRET_KEY = "pinequest-secret";

export const createClassroom = async (req, res) => {
  try {
    const { lectureName, teacherId, lectureDate } = req.body;

    if (!lectureName || !lectureDate || !teacherId) {
      return res.status(400).json({
        message: "lectureName, lectureDate болон teacherId шаардлагатай",
      });
    }

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Багш олдсонгүй" });
    }

    let joinCode;
    let isUnique = false;

    while (!isUnique) {
      joinCode = generateJoinCode();
      const existingClassroom = await ClassroomModel.findOne({ joinCode });
      if (!existingClassroom) {
        isUnique = true;
      }
    }

    const newClassroom = new ClassroomModel({
      lectureName,
      lectureDate,
      teacher: teacherId,
      joinCode,
      ClassroomStudents: [],
      attendanceHistory: [],
    });

    const savedClassroom = await newClassroom.save();

    const tokenPayload = {
      classroomId: savedClassroom._id,
      lectureName,
      lectureDate,
      teacherName: teacher.teacherName,
    };

    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "30d" });
    const joinLink = `${process.env.FRONT_END_URL}/join?token=${token}`;

    savedClassroom.joinLink = joinLink;
    await savedClassroom.save();

    await TeacherModel.findByIdAndUpdate(teacherId, {
      $addToSet: { Classrooms: savedClassroom._id },
    });

    return res.status(201).json({
      message: "Ангийг амжилттай үүсгэлээ",
      classroom: savedClassroom,
      joinLink,
      joinCode,
    });
  } catch (error) {
    console.error("❌ createClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId is required" });
    }

    const deletedClassroom = await ClassroomModel.findByIdAndDelete(
      classroomId
    );

    if (!deletedClassroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Remove classroom reference from teacher
    await TeacherModel.findByIdAndUpdate(deletedClassroom.teacher, {
      $pull: { Classrooms: classroomId },
    });

    return res
      .status(200)
      .json({ message: "Classroom deleted successfully" });
  } catch (error) {
    console.error("❌ deleteClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}

export const getOnlyClassroomsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    // зөвхөн _id, lectureName авах
    const classrooms = await ClassroomModel.find(
      { teacher: teacherId },
      "_id lectureName lectureDate joinLink"
    );

    return res.status(200).json({ classrooms });
  } catch (error) {
    console.error("❌ getOnlyClassroomsByTeacherId error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getClassroomsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;
    // const { date } = req.body; // one date only

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    // Build query
    const query = { teacher: teacherId };

    // if (date) {
    //   const day = new Date(date);
    //   const startOfDay = new Date(day.setHours(0, 0, 0, 0));
    //   const endOfDay = new Date(day.setHours(23, 59, 59, 999));
    //   query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    // }

    const classrooms = await ClassroomModel.find(query)
      .populate({
        path: "attendanceHistory",
        model: "Attendance",
        populate: {
          path: "attendingStudents.student", // ✅ populate the student field inside subdocument
          model: "User",
          select: "studentId name", // select whatever fields you want
        },
      })
      .populate("ClassroomStudents", "studentId name")
      .populate("lectureName");

    // Format output
    const formattedClassrooms = classrooms.map((classroom) => ({
      _id: classroom._id,
      lectureName: classroom.lectureName,
      lectureDate: classroom.lectureDate,
      teacher: classroom.teacher,
      ClassroomStudents: classroom.ClassroomStudents,
      joinLink: classroom.joinLink,
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt,
      attendanceHistory: classroom.attendanceHistory.map((attendance) => ({
        _id: attendance._id,
        date: attendance.createdAt,
        endedAt: attendance.endedAt,
        isActive: !attendance.endedAt,
        attendingStudents: attendance.attendingStudents.map((s) => ({
          _id: s._id,
          attendedAt: s.attendedAt,
          student: s.student, // this will now include full User info
        })),
        totalAttending: attendance.attendingStudents.length,
      })),
    }));

    return res.status(200).json({ classrooms: formattedClassrooms });
  } catch (error) {
    console.error("❌ getClassroomsByTeacherId error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const createAttendance = async (req, res) => {
  try {
    const { classroomId, latitude, longitude } = req.body;

    if (!classroomId || latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ message: "classroomId, latitude and longitude are required" });
    }

    // Check classroom exists (optional but recommended)
    const classroom = await ClassroomModel.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Create new attendance linked to this classroom with location data
    const newAttendance = await AttendanceModel.create({
      classroom: classroomId,
      attendingStudents: [],
      endedAt: null,
      latitude,
      longitude,
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

export const getClassroomsAndStudentsByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }

    const query = { teacher: teacherId };

    const classrooms = await ClassroomModel.find(query)
      .populate({
        path: "attendanceHistory",
        model: "Attendance",
        populate: {
          path: "attendingStudents.student", // ✅ populate the student field inside subdocument
          model: "User",
          select: "studentId name", // select whatever fields you want
        },
      })
      .populate("ClassroomStudents", "studentId name")
      .populate("lectureName");

    // Format output
    const formattedClassrooms = classrooms.map((classroom) => ({
      _id: classroom._id,
      lectureName: classroom.lectureName,
      lectureDate: classroom.lectureDate,
      teacher: classroom.teacher,
      ClassroomStudents: classroom.ClassroomStudents,
      joinCode: classroom.joinCode,
      joinLink: classroom.joinLink,
    }));

    return res.status(200).json({ classrooms: formattedClassrooms });
  } catch (error) {
    console.error("❌ getClassroomsByTeacherId error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
export const getStudentsByClassroomId = async (req, res) => {
  const { classroomId } = req.params;

  try {
    const classroom = await ClassroomModel.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: "Анги олдсонгүй" });
    }

    if (
      !classroom.ClassroomStudents ||
      classroom.ClassroomStudents.length === 0
    ) {
      return res.status(200).json({
        empty: true,
        message: "Энэ ангид одоогоор оюутан байхгүй байна",
      });
    }

    return res.status(200).json({ students: classroom.ClassroomStudents });
  } catch (error) {
    console.error("Error fetching students by classroom:", error);
    return res.status(500).json({ message: "Оюутнуудыг авахад алдаа гарлаа" });
  }
};
