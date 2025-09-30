import { Facemodel } from "../models/image.model.js";

// Controller to save the image and student ID
export const saveFaceImage = async (req, res) => {
  try {
    const { studentId, image } = req.body;

    if (!studentId || !image) {
      return res.status(400).json({ message: 'Student ID and image are required' });
    }

    // Upsert: update if exists, insert if not
    await Facemodel.findOneAndUpdate(
      { studentId },
      { image },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: 'Face image saved or updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Controller to get the image by student ID
export const getFaceImageByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find the face image by studentId
    const faceImage = await Facemodel.findOne({ studentId });

    // Check if the face image exists
    if (!faceImage) {
      return res.status(404).json({ message: 'No face image found for this student ID' });
    }

    // Return the found face image
    return res.status(200).json({
      studentId: faceImage.studentId,
      image: faceImage.image,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
