const router = require("express").Router();
const imageController = require("../controllers/image.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");

/**
 * @swagger
 * tags:
 *   name: Image
 *   description: Image upload and management
 */

/**
 * @swagger
 * /api/image/uploadImage:
 *   post:
 *     summary: Upload an image with metadata (UTC time required)
 *     description: |
 *       **Important:** Frontend must send `captureDateTime` in **UTC format** (e.g., `"2025-07-10T08:50:32.354Z"`).  
 *       This value should reflect **Indian Standard Time** converted to UTC.  
 *       **Location** must be a string in the format `"longitude,latitude"` (e.g., `"75.8577,22.7196"` for Indore).
 *     tags: [Image]
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
 *               - image
 *             properties:
 *               location:
 *                 type: string
 *                 description: Coordinates in `"longitude,latitude"` format.
 *                 example: "75.8577,22.7196"
 *               captureDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Must be in UTC (converted from IST).
 *                 example: "2025-07-10T08:50:32.354Z"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: Point
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [75.8577, 22.7196]
 *                     captureDateTime:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-10T08:50:32.354Z"
 *                     status:
 *                       type: string
 *                       example: In-Progress
 *                     metricSummary:
 *                       type: object
 *                       properties:
 *                         OSA:
 *                           type: integer
 *                           example: 0
 *                         Sos:
 *                           type: integer
 *                           example: 0
 *                         PGC:
 *                           type: integer
 *                           example: 0
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://skool-search.s3.ap-south-1.amazonaws.com/images/1752145888556_Elephant.jfif"
 *                     belongsTo:
 *                       type: string
 *                       description: User ID who uploaded the image
 *                       example: "686f9907118f04da978015dd"
 *                     _id:
 *                       type: string
 *                       example: "686f9fe034700148dbac81d0"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-10T11:11:28.781Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-10T11:11:28.781Z"
 *                     __v:
 *                       type: integer
 *                       example: 0
 *       400:
 *         description: Missing fields or invalid datetime/location
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error or S3 upload failure
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
