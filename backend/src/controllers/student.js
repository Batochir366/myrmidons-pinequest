import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { UserModel } from "../models/user.model.js";

export const addStudentToAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.body;

    if (!attendanceId || !studentId) {
      return res
        .status(400)
        .json({ message: "attendanceId болон studentId хэрэгтэй" });
    }

    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(
      attendanceId,
      { $addToSet: { attendingStudents: studentId } },
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
export const joinClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.body;

    if (!classroomId || !studentId) {
      return res
        .status(400)
        .json({ message: "classroomId болон studentId шаардлагатай" });
    }
    const student = await UserModel.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ message: "Сурагч олдсонгүй" });
    }
    const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
      classroomId,
      { $addToSet: { ClassroomStudents: student._id } },
      { new: true }
    );

    if (!updatedClassroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    return res.status(200).json({
      message: "Сурагч ангид амжилттай нэгдлээ",
      classroom: updatedClassroom,
    });
  } catch (error) {
    console.error("❌ joinClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
