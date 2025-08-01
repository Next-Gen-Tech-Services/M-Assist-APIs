const router = require("express").Router();
const imageController = require("../controllers/image.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadImageFile } = require("../utils/helpers/files.util");


// IMP. Front-end Should give Time in UTC Format which is equal to Indian Time.
router.post("/upload", jwt.authenticateJWT,
  uploadImageFile.array("images", 20), // Only PNG, JPG, JPEG allowed
  async (req, res) => {
    try {
      const result = await imageController.uploadImage(req, res);
      return result;
    } catch (error) {
      log.error("Internal Server Error: ", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post("/sync-offline-upload", jwt.authenticateJWT, uploadImageFile.array("images", 20), async (req, res) => {
  try {
    const result = await imageController.syncOfflineUpload(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/status/:imageId", jwt.authenticateJWT, async (req, res) => {
  try {
    const result = await imageController.imageProcessingStatus(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
// similarly here we need to delete the shelf card along with images,
  It will be implement once whole design is ready and front-end integrate APIs.
router.delete("/deleteImage/:imageId", jwt.authenticateJWT, async (req, res) => {
  try {
    const result = await imageController.deleteImage(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
})

*/


module.exports = router;
