import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";

export const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    if (!attendanceId) {
      return res.status(400).json({ message: "attendanceId шаардлагатай" });
    }

    const activeAttendance = await AttendanceModel.findById(attendanceId)
      .populate({
        path: "attendingStudents",
        model: "User", // Using User model for students
        select: "studentId studentName embedd",
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

export const getClassroomAttendanceHistoryById = async (req, res) => {
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
