// code to store file into memory and then our services will upload the file
const multer = require("multer");

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Optional: 10MB limit
  },
});

module.exports = {
  uploadFile,
};