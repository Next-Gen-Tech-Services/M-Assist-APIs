const router = require("express").Router();
const imageController = require("../controllers/image.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     tags:
 *       - Images
 *     summary: Upload shelf images
 *     description: Upload up to 20 images with location and timestamp to create a new shelf entry.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - location
 *               - captureDateTime
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               location:
 *                 type: string
 *                 example: "77.5946,12.9716"
 *               captureDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-16T10:30:00Z"
 *     responses:
 *       200:
 *         description: Upload completed
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */

// IMP. Front-end Should give Time in UTC Format which is equal to Indian Time.
router.post("/upload", jwt.authenticateJWT, uploadFile.array("images", 20), async (req, res) => {
  try {
    const result = await imageController.uploadImage(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
);

/**
 * @swagger
 * /api/images/sync-offline-upload:
 *   post:
 *     tags:
 *       - Images
 *     summary: Sync offline images
 *     description: Uploads previously captured images and avoids duplication using hash matching.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - location
 *               - captureDateTime
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               location:
 *                 type: string
 *                 example: "77.5946,12.9716"
 *               captureDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-16T10:30:00Z"
 *     responses:
 *       200:
 *         description: Offline sync completed
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

router.post("/sync-offline-upload", jwt.authenticateJWT, uploadFile.array("images", 20), async (req, res) => {
  try {
    const result = await imageController.syncOfflineUpload(req, res);
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
