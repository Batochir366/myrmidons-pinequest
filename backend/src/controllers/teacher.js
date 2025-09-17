import { AttendanceModel } from "../models/attendance.model.js";
import { TeacherModel } from "../models/teacher.model.js";


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

 export const getTeacherWithClasses = async (req,res) => {
  const { teacherId } = req.params;
  const teacher = await TeacherModel.findById(teacherId)
  .populate({
    path: "attendanceHistory",
    populate: { path: "attendingStudents" } 
  });
  return teacher;
}
export const endClassroom = async (req, res) => {
  try {
    const { classroomId } = req.body;

    if (!classroomId) {
      return res.status(400).json({ message: "Classroom ID is required" });
    }

    const updatedClassroom = await AttendanceModel.findByIdAndUpdate(
      classroomId,
      { endedAt: new Date() },
      { new: true }
    );

    if (!updatedClassroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    return res.status(200).json({ message: "Classroom ended", classroom: updatedClassroom });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

