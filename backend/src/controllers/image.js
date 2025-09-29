import { Facemodel } from "../models/image.model";

// Controller to save the image and student ID
export const saveFaceImage = async (req, res) => {
  try {
    const { studentId, image } = req.body;

    // Check if studentId and image are provided
    if (!studentId || !image) {
      return res.status(400).json({ message: 'Student ID and image are required' });
    }

    // Create a new document in the database
    const newFaceImage = new Facemodel({
      studentId,
      image,
    });

    // Save the new face image document to the database
    await newFaceImage.save();

    // Return a success response
    return res.status(201).json({ message: 'Face image saved successfully' });
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
