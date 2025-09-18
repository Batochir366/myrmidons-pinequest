import { AttendanceModel } from "../models/attendance.model.js";

export const addStudentToAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.body;

    if (!attendanceId || !studentId) {
      return res
        .status(400)
        .json({ message: "attendanceId болон studentId хэрэгтэй" });
    }

    // Attendance-д student-г нэмэх
    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(
      attendanceId,
      { $addToSet: { attendingStudents: studentId } }, // duplicate-г давхаргүй нэмнэ
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance олдсонгүй" });
    }

    res.status(200).json(updatedAttendance);
  } catch (error) {
    console.error("❌ addStudentToAttendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
