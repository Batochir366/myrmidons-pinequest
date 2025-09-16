import { AttendanceModel } from "../models/attendance.model.js";

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
