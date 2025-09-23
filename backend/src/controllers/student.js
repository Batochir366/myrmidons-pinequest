import { AttendanceModel } from "../models/attendance.model.js";
import { ClassroomModel } from "../models/classroom.model.js";
import { UserModel } from "../models/user.model.js";

export const addStudentToAttendance = async (req, res) => {
  try {
    const { attendanceId, studentId } = req.body;

    // Only process attendanceId and studentId
    if (!attendanceId || !studentId) {
      return res
        .status(400)
        .json({ message: "attendanceId болон studentId хэрэгтэй" });
    }

    // Continue with your existing logic
    const student = await UserModel.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ message: "Сурагч олдсонгүй" });
    }

    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance олдсонгүй" });
    }

    const classroom = await ClassroomModel.findOne({
      _id: attendance.classroom,
      "ClassroomStudents.studentId": student.studentId,
    });

    if (!classroom) {
      return res.status(403).json({
        message: "Та энэ хичээлд нэгдээгүй байна. Эхлээд хичээлд нэгдэнэ үү.",
      });
    }

    const alreadyAttended = attendance.attendingStudents.some(
      (s) => s.student.toString() === student._id.toString()
    );

    if (alreadyAttended) {
      return res
        .status(400)
        .json({ message: "Та аль хэдийн ирц бүртгэгдсэн байна." });
    }

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
      return res.status(200).json({
        message: "Сурагч аль хэдийн энэ ангид байна",
        alreadyJoined: true,
        classroom: {
          name: existingClassroom.name,
          classroomId: existingClassroom._id,
        },
        student: {
          name: student.name,
          studentId: student.studentId,
        },
      });
    }

    // Retrieve the student's existing embedding
    const realname = student.name;
    const embedding = student.embedding;
    // Create the student object with required fields for ClassroomStudents array
    const classroomStudent = {
      studentId: studentId,
      name: realname,
      embedding: embedding,
    };

    // Add student to classroom's ClassroomStudents array
    const updatedClassroom = await ClassroomModel.findByIdAndUpdate(
      classroomId,
      { $addToSet: { ClassroomStudents: classroomStudent } },
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
export const joinClassroomByCode = async (req, res) => {
  try {
    const { studentId, joinCode } = req.body;

    if (!studentId || !joinCode) {
      return res.status(400).json({
        message: "studentId болон joinCode шаардлагатай",
      });
    }

    // Find classroom by join code
    const classroom = await ClassroomModel.findOne({ joinCode });
    if (!classroom) {
      return res.status(404).json({
        message: "Ийм код бүхий анги олдсонгүй",
      });
    }

    // Find student
    const student = await UserModel.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        message: "Оюутан олдсонгүй",
      });
    }

    // Check if student already in classroom
    const isAlreadyMember = classroom.ClassroomStudents.some(
      (classroomStudent) => classroomStudent.studentId === studentId
    );

    if (isAlreadyMember) {
      return res.status(409).json({
        message: "Та энэ ангид аль хэдийн элссэн байна",
        classroom: {
          lectureName: classroom.lectureName,
          classroomId: classroom._id,
          lectureDate: classroom.lectureDate,
        },
      });
    }
    const classroomStudent = {
      studentId: studentId,
      name: student.name,
      embedding: student.embedding,
    };
    await ClassroomModel.findByIdAndUpdate(classroom._id, {
      $addToSet: { ClassroomStudents: classroomStudent },
    });
    await UserModel.findByIdAndUpdate(student._id, {
      $addToSet: { Classrooms: classroom._id },
    });

    return res.status(200).json({
      message: "Ангид амжилттай элслээ",
      classroom: {
        _id: classroom._id,
        lectureName: classroom.lectureName,
        lectureDate: classroom.lectureDate,
      },
    });
  } catch (error) {
    console.error("❌ joinClassroomByCode error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
