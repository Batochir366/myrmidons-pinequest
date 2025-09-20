import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { UserModel } from "../models/user.model.js";

// export const checkStudentInClassroom = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     if (!studentId) {
//       return res.status(400).json({ message: "studentId шаардлагатай" });
//     }

//     const student = await UserModel.findOne({ studentId: studentId });
//     if (!student) {
//       return res.status(404).json({ message: "Сурагч олдсонгүй" });
//     }

//     const classroom = await ClassroomModel.findOne({
//       ClassroomStudents: student._id,
//     });

//     if (!classroom) {
//       return res.status(404).json({
//         message:
//           "Та ямар ч хичээлд нэгдээгүй байна. Эхлээд хичээлд нэгдэнэ үү.",
//       });
//     }

//     res.status(200).json({
//       message: "Оюутан хичээлд нэгдсэн байна",
//       classroomId: classroom._id,
//       classroomName: classroom.name,
//     });
//   } catch (error) {
//     console.error("❌ checkStudentInClassroom error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const addStudentToAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.body;

    if (!attendanceId || !studentId) {
      return res
        .status(400)
        .json({ message: "attendanceId болон studentId хэрэгтэй" });
    }

    // Сурагчийн ID шалгах
    const student = await UserModel.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ message: "Сурагч олдсонгүй" });
    }

    // Attendance авах
    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance олдсонгүй" });
    }

    // Сурагч тухайн ангидаа байгаа эсэхийг шалгах
    const classroom = await ClassroomModel.findOne({
      _id: attendance.classroom,
      ClassroomStudents: student._id,
    });

    if (!classroom) {
      return res.status(403).json({
        message: "Та энэ хичээлд нэгдээгүй байна. Эхлээд хичээлд нэгдэнэ үү.",
      });
    }

    // Давхардах шалгалт
    const alreadyAttended = attendance.attendingStudents.some(
      (s) => s.student.toString() === student._id.toString()
    );

    if (alreadyAttended) {
      return res
        .status(400)
        .json({ message: "Та аль хэдийн ирц бүртгэгдсэн байна." });
    }

    // Ирц нэмэх
    attendance.attendingStudents.push({
      student: student._id,
      attendedAt: new Date(),
    });

    await attendance.save();

    return res.status(200).json({
      message: "Ирц амжилттай бүртгэгдлээ",
      attendance,
    });
  } catch (error) {
    console.error("❌ addStudentToAttendance error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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

    // Find the student by studentId
    const student = await UserModel.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: "Сурагч олдсонгүй" });
    }

    // Check if student is already in the classroom
    const existingClassroom = await ClassroomModel.findOne({
      _id: classroomId,
      "ClassroomStudents.studentId": student.studentId,
    });

    if (existingClassroom) {
      return res
        .status(400)
        .json({ message: "Сурагч аль хэдийн энэ ангид байна" });
    }

    // Retrieve the student's existing embedding
    const embedding = student.embedding; // Existing embedding

    // Create the student object with required fields for ClassroomStudents array
    const classroomStudent = {
      studentId: student.studentId,
      name: student.name,
      embedding: embedding,
    };

    // Add student to classroom's ClassroomStudents array
    const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
      classroomId,
      { $addToSet: { ClassroomStudents: classroomStudent } }, // Add student with detailed info
      { new: true }
    );

    if (!updatedClassroom) {
      return res.status(404).json({ message: "Classroom олдсонгүй" });
    }

    const updatedStudent = await UserModel.findByIdAndUpdate(
      student._id,
      { $addToSet: { Classrooms: classroomId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Сурагч ангид амжилттай нэгдлээ",
      classroom: {
        name: updatedClassroom.name,
        classroomId: updatedClassroom._id,
      },
      student: {
        name: updatedStudent.name,
        studentId: updatedStudent.studentId,
      },
    });
  } catch (error) {
    console.error("❌ joinClassroom error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
