import { AttendanceModel } from "../models/attendance.model.js";
import { TeacherModel } from "../models/teacher.model.js";

export const createTeacher = async (req, res) => {
  try {
    const newTeacher = await TeacherModel.create({
      teacherName: "A. Dumbledore",
    });
    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const teacherLogin = async (req, res) => {
  try {
    const teacher = await TeacherModel.findOne({
      teacherName: "A. Dumbledore",
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const createClassroom = async (req, res) => {
  try {
    const { teacherId, lectureName, lectureDate } = req.body;

    const newClassroom = await AttendanceModel.create({
      teacher: teacherId,
      lectureName,
      lectureDate,
      attendingStudents: [],
    });

    res.status(201).json(newClassroom);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getClassroomsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const classrooms = await AttendanceModel.find({
      teacher: teacherId,
    }).populate("Student");

    res.status(200).json(classrooms);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getTeacher = async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await TeacherModel.findById(teacherId);
  res.status(200).json(teacher);
};

export default getTeacher;
