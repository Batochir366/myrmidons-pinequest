import { AttendanceModel } from "../models/attendance.model.js";
import { TeacherModel } from "../models/teacher.model.js";

export const verifyAttendance = async (req, res) => {
  try {
    const { classroomId, studentId } = req.body;

    if (!classroomId || !studentId) {
      return res
        .status(400)
        .json({ success: false, message: "classroomId and studentId required" });
    }

    const classroom = await AttendanceModel.findByIdAndUpdate(
      classroomId,
      { $addToSet: { attendingStudents: studentId } }, // no duplicates
      { new: true }
    ).populate("attendingStudents", "studentName"); // optional populate

    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found" });
    }

    await TeacherModel.findByIdAndUpdate(classroom.teacher, {
      $addToSet: { attendanceHistory: classroom._id },
    });

    res.json({
      success: true,
      message: "Attendance verified successfully",
      classroom,
    });
  } catch (err) {
    console.error("Verify attendance error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
};
