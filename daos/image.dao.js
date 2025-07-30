const Image = require("../models/image.model");
const getNextSequenceValue = require("../utils/helpers/counter.util");
const log = require("../configs/logger.config");
const { hashItem } = require("../utils/helpers/bcrypt.util");
class ImageDAO {
  async createImage(imageData) {
    try {
      const newImage = await Image.create(imageData);
      return {
        status: "success",
        code: 201,
        data: newImage,
      };
    } catch (error) {
      log.error("Error in [ImageDAO.createImage]:", error);
      return {
        status: "error",
        code: 500,
        message: "Failed to create image",
        data: null,
      };
    }
  }
  async uploadImageDetails(data) {
    try {
      const newImage = new Image({
        userId: data.userId,
        shelfId: data.shelfId || null, // Optional; can be set later
        location: data.location,       // GeoJSON Point
        captureDateTime: data.captureDateTime,
        imageUrl: data.imageUrl || "", // In case of failed upload
        imageSizeInKB: data.imageSizeInKB || 0,
        fileHash: data.fileHash,
        status: data.status || "PENDING", // Default if not passed
      });

      const result = await newImage.save();
      return result;
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
  async hasImagesByUserId(userId) {
    try {
      const count = await Image.countDocuments({ userId });
      return count > 0;
    } catch (error) {
      log.error("Error from [ImageDAO - hasImagesByUserId]:", error);
      throw error;
    }
  }
  async getAllImagesWithShelfAndUser() {
    try {
      const images = await Image.find({}).sort({ captureDateTime: -1, createdAt: -1 }).populate({ path: 'userId', select: 'fullName' }).populate({ path: 'shelfId', select: 'metricSummary' });
      return images;
    } catch (error) {
      log.error("Error from [ImageDAO - getAllImagesWithShelfAndUser]:", error);
      throw error;
    }
  }
}

module.exports = new ImageDAO();
