import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { UserModel } from "../models/user.model.js";

export const checkStudentAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.params;

    if (!attendanceId || !studentId) {
      return res.status(400).json({
        message: "attendanceId болон studentId хэрэгтэй",
      });
    }

    const student = await UserModel.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({
        already_attended: false,
        message: "Сурагч олдсонгүй",
      });
    }

    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({
        already_attended: false,
        message: "Attendance олдсонгүй",
      });
    }

    const alreadyAttended = attendance.attendingStudents.some(
      (s) => s.student.toString() === student._id.toString()
    );

    if (alreadyAttended) {
      return res.status(409).json({
        already_attended: true,
        message: "Таны ирц аль хэдийн бүртгэгдсэн байна.",
      });
    }

    return res.status(200).json({
      already_attended: false,
      message: "Student can attend",
    });
  } catch (error) {
    console.error("❌ checkStudentAttendance error:", error);
    return res.status(500).json({
      already_attended: false,
      message: "Server error",
      error: error.message,
    });
  }
};

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
        lectureDate: classroom.lectureDate,
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

export const getClassroomById = async (req, res) => {
  try {
    const { classroomId } = req.params;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId шаардлагатай" });
    }

    const classroom = await ClassroomModel.findById(classroomId);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    return res.status(200).json({
      message: "Classroom амжилттай олдлоо",
      classroom,
    });
  } catch (error) {
    console.error("❌ getClassroomByIdFull error:", error);
    return res.status(500).json({
      message: "Серверийн алдаа",
      error: error.message,
    });
  }
};
