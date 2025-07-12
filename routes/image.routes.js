const router = require("express").Router();
const imageController = require("../controllers/image.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");

/**
 * @swagger
 * /api/image/upload:
 *   post:
 *     summary: Upload shelf images
 *     description: Upload images along with location and capture time. Frontend must send UTC timestamp.
 *     tags:
 *       - Images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - captureDateTime
 *               - images
 *             properties:
 *               location:
 *                 type: string
 *                 example: "75.8577,22.7196"
 *                 description: "Longitude and Latitude as comma-separated string (lng,lat)"
 *               captureDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-12T07:45:00.000Z"
 *                 description: "UTC format timestamp. Indian time should be converted to UTC on frontend."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully and shelf created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     shelfId:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Missing required fields or bad input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/image/sync-offline-upload:
 *   post:
 *     summary: Sync offline captured shelf images
 *     description: Retry uploading images that failed previously. If already uploaded, they'll be skipped.
 *     tags:
 *       - Images
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - captureDateTime
 *               - images
 *             properties:
 *               location:
 *                 type: string
 *                 example: "75.8577,22.7196"
 *                 description: "Longitude and Latitude as comma-separated string (lng,lat)"
 *               captureDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-07-12T07:45:00.000Z"
 *                 description: "UTC format timestamp. Indian time should be converted to UTC on frontend."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded or skipped. Shelf created or updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     shelfId:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Missing required fields or bad input
 *       401:
 *         description: Unauthorized
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

router.post("/sync-offline-upload", jwt.authenticateJWT, uploadFile.array("images", 20), async (req, res) => {
  try {
    const result = await imageController.syncOfflineUpload(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// IMP. Front-end will recieve time in UTC, So front needs to parse to show time in indian format
/*
// It needs upgradation acc. to Shelf because at the at we display  Shelf(card)
and each card(Shelf) containing images
router.get("/getAllImages", jwt.authenticateJWT, async (req, res) => {
  try {
    const result = await imageController.getAllImages(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


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
