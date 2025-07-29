// code to store file into memory and then our services will upload the file
const multer = require("multer");

// Common storage (memory)
const storage = multer.memoryStorage();

// Optional: 10MB limit for all
const limits = {
  fileSize: 10 * 1024 * 1024,
};

// Shared base uploader (no fileFilter)
const uploadFile = multer({ storage, limits });

const uploadImageFile = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpg", "image/jpeg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, and JPEG images are allowed"));
    }
  },
});

module.exports = {
  uploadFile,       // for general use (videos, thumbnails, etc.)
  uploadImageFile,  // for PNG/JPG image uploads
};
