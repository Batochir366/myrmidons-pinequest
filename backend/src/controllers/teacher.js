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

    const joinLink = `https://myrmidons-pinequest-pyznrthos-batj2003-3877s-projects.vercel.app/join?token=${token}`;

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

export const getAttendingStudents = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    if (!attendanceId) {
      return res.status(400).json({ message: "attendanceId шаардлагатай" });
    }

    // Find the attendance record and populate student details
    const attendance = await AttendanceModel.findById(attendanceId)
      .populate({
        path: "attendingStudents",
        model: "User", // Using User model for students
        select: "studentId studentName", // Select only needed fields (no email in your schema)
      })
      .populate({
        path: "classroom",
        model: "Classroom",
        select: "lectureName",
      });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance олдсонгүй" });
    }

    return res.status(200).json({
      message: "Ирцийн мэдээлэл амжилттай авлаа",
      attendance: {
        _id: attendance._id,
        classroom: attendance.classroom,
        createdAt: attendance.createdAt,
        endedAt: attendance.endedAt,
        attendingStudents: attendance.attendingStudents,
        totalAttending: attendance.attendingStudents.length,
      },
    });
  } catch (error) {
    console.error("❌ getAttendingStudents error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get all attendance sessions for a classroom with student details
export const getClassroomAttendanceHistory = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId шаардлагатай" });
    }

    // Find classroom and populate attendance history with student details
    const classroom = await ClassroomModel.findById(classroomId)
      .populate({
        path: "attendanceHistory",
        model: "Attendance",
        populate: {
          path: "attendingStudents",
          model: "User", // Using User model for students
          select: "studentId studentName",
        },
      })
      .select("lectureName attendanceHistory");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    // Format the response
    const attendanceHistory = classroom.attendanceHistory.map((attendance) => ({
      _id: attendance._id,
      date: attendance.createdAt,
      endedAt: attendance.endedAt,
      isActive: !attendance.endedAt,
      attendingStudents: attendance.attendingStudents,
      totalAttending: attendance.attendingStudents.length,
    }));

    return res.status(200).json({
      message: "Ирцийн түүх амжилттай авлаа",
      classroom: {
        _id: classroom._id,
        lectureName: classroom.lectureName,
        attendanceHistory,
      },
    });
  } catch (error) {
    console.error("❌ getClassroomAttendanceHistory error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get current active attendance for a classroom
export const getCurrentAttendance = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId шаардлагатай" });
    }

    // Find active attendance (where endedAt is null)
    const activeAttendance = await AttendanceModel.findOne({
      classroom: classroomId,
      endedAt: null,
    })
      .populate({
        path: "attendingStudents",
        model: "User", // Using User model for students
        select: "studentId studentName",
      })
      .populate({
        path: "classroom",
        model: "Classroom",
        select: "lectureName",
      });

    if (!activeAttendance) {
      return res.status(404).json({ message: "Идэвхтэй ирц олдсонгүй" });
    }

    return res.status(200).json({
      message: "Идэвхтэй ирц амжилттай авлаа",
      attendance: {
        _id: activeAttendance._id,
        classroom: activeAttendance.classroom,
        createdAt: activeAttendance.createdAt,
        attendingStudents: activeAttendance.attendingStudents,
        totalAttending: activeAttendance.attendingStudents.length,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("❌ getCurrentAttendance error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Get attendance statistics for a classroom
export const getAttendanceStats = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId шаардлагатай" });
    }

    const classroom = await ClassroomModel.findById(classroomId)
      .populate("ClassroomStudents", "studentId studentName") // Using ClassroomStudents field from your schema
      .populate({
        path: "attendanceHistory",
        model: "Attendance",
        populate: {
          path: "attendingStudents",
          model: "User", // Using User model for students
          select: "studentId studentName",
        },
      });

    if (!classroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    const totalStudents = classroom.ClassroomStudents.length;
    const totalSessions = classroom.attendanceHistory.length;

    // Calculate attendance stats for each student
    const studentStats = classroom.ClassroomStudents.map((student) => {
      const attendedSessions = classroom.attendanceHistory.filter(
        (attendance) =>
          attendance.attendingStudents.some(
            (attendingStudent) =>
              attendingStudent._id.toString() === student._id.toString()
          )
      ).length;

      const attendanceRate =
        totalSessions > 0
          ? ((attendedSessions / totalSessions) * 100).toFixed(1)
          : 0;

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        attendedSessions,
        totalSessions,
        attendanceRate: parseFloat(attendanceRate),
      };
    });

    return res.status(200).json({
      message: "Ирцийн статистик амжилттай авлаа",
      stats: {
        classroom: {
          _id: classroom._id,
          lectureName: classroom.lectureName,
          totalStudents,
          totalSessions,
        },
        studentStats,
      },
    });
  } catch (error) {
    console.error("❌ getAttendanceStats error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
