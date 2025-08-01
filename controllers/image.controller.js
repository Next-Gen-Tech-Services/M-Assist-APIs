const imageService = require("../services/image.service");

class ImageController {
  async uploadImage(req, res) {
    try {
      const result = await imageService.uploadService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async syncOfflineUpload(req, res) {
    try {
      const result = await imageService.syncOfflineUploadService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async getAllImages(req, res) {
    try {
      const result = await imageService.getAllImagesService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async deleteImage(req, res) {
    try {
      const result = await imageService.deleteImageService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async imageProcessingStatus(req, res) {
    try {
      const result = await imageService.imageProcessingStatusService(req, res);
      return result;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = new ImageController();
