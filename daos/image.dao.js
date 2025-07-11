const Image = require("../models/image.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
class ImageDAO {
  async uploadImageDetails(data) {
    try {
      const newImage = new Image({
        name: data.name,
        location: data.location,
        captureDateTime: data.captureDateTime, // new date field
        status: data.status,
        metricSummary: data.metricSummary,
        imageUrl: data.imageUrl,
        belongsTo: data.userId, // from req.user._id
      });

      const result = await newImage.save();
      return result; // or return relevant fields if needed
    } catch (error) {
      log.error("Error from [ImageDAO]:", error);
      throw error;
    }
  }
  async getAllImagesSortedByDate() {
    try {
      return await Image.find({}).sort({
        captureDateTime: -1,  // Primary sort
        createdAt: -1         // Secondary sort for tie-breaking
      });
    } catch (error) {
      log.error("Error from [ImageDAO - getAllImagesSortedByDate]:", error);
      throw error;
    }
  }
  async deleteImage(imageId) {
    try {
      const imageDoc = await Image.findById(imageId);
      if (!imageDoc) {
        return null;
      }

      await Image.findByIdAndDelete(imageId);
      return imageDoc; // Return the deleted document for cleanup (S3 etc.)
    } catch (error) {
      log.error("Error from [ImageDAO - deleteImage]:", error);
      throw error;
    }
  }
}

module.exports = new ImageDAO();
