import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { UserModel } from "../models/user.model.js";

// Add these endpoints to your backend

// Check if student is in any classroom (for attendance verification)
export const checkStudentInClassroom = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "studentId шаардлагатай" });
    }

    // Check if student exists in any classroom
    const classroom = await ClassroomModel.findOne({
      students: studentId,
    });

    if (!classroom) {
      return res.status(404).json({
        message:
          "Та ямар ч хичээлд нэгдээгүй байна. Эхлээд хичээлд нэгдэнэ үү.",
      });
    }

    res.status(200).json({
      message: "Оюутан хичээлд нэгдсэн байна",
      classroomId: classroom._id,
      classroomName: classroom.name,
    });
  } catch (error) {
    console.error("❌ checkStudentInClassroom error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Updated addStudentToAttendance with classroom verification
export const addStudentToAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.body;

    if (!attendanceId || !studentId) {
      return res
        .status(400)
        .json({ message: "attendanceId болон studentId хэрэгтэй" });
    }

    // First, get the attendance record to find the classroom
    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance олдсонгүй" });
    }

    // Check if student is in the classroom
    const classroom = await ClassroomModel.findOne({
      _id: attendance.classroomId,
      students: studentId,
    });

    if (!classroom) {
      return res.status(403).json({
        message: "Та энэ хичээлд нэгдээгүй байна. Эхлээд хичээлд нэгдэнэ үү.",
      });
    }

    // Check if student is already in attendance
    if (attendance.attendingStudents.includes(studentId)) {
      return res.status(400).json({
        message: "Та аль хэдийн ирц бүртгэгдсэн байна.",
      });
    }

    // Add student to attendance
    const updatedAttendance = await AttendanceModel.findByIdAndUpdate(
      attendanceId,
      { $addToSet: { attendingStudents: studentId } },
      { new: true }
    );

    res.status(200).json({
      message: "Ирц амжилттай бүртгэгдлээ",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error("❌ addStudentToAttendance error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Routes to add to your router:
// GET /student/check/:studentId - checkStudentInClassroom
// POST /attendance/add-student - addStudentToAttendance
export const joinClassroom = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.body;

    if (!classroomId || !studentId) {
      return res
        .status(400)
        .json({ message: "classroomId болон studentId шаардлагатай" });
    }

    // Find the student by studentId
    const student = await UserModel.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ message: "Сурагч олдсонгүй" });
    }

    // Add student to classroom's ClassroomStudents array (avoid duplicates with $addToSet)
    const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
      classroomId,
      { $addToSet: { ClassroomStudents: student._id } },
      { new: true }
    );

    if (!updatedClassroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    // Update the student's Classrooms array to include this classroom (also avoid duplicates)
    const updatedStudent = await UserModel.findByIdAndUpdate(
      student._id,
      { $addToSet: { Classrooms: classroomId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Сурагч ангид амжилттай нэгдлээ",
      classroom: updatedClassroom,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("❌ joinClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
