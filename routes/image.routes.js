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

/**
 * @swagger
 * /api/image/getAllImages:
 *   get:
 *     summary: Get all uploaded images sorted by capture date
 *     description: |
 *       Returns all uploaded images for the authenticated user.  
 *       **Note:** `captureDateTime` is stored in UTC. Frontend should convert it to IST for display.  
 *       The `location` field is returned in GeoJSON format: `{ type: "Point", coordinates: [longitude, latitude] }`.
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Images fetched successfully
 *               status: success
 *               code: 200
 *               data:
 *                 - _id: "6870b2932d8cd223c1266fed"
 *                   location:
 *                     type: Point
 *                     coordinates: [75.8577, 22.7196]
 *                   captureDateTime: "2025-07-11T06:42:11.450Z"
 *                   status: In-Progress
 *                   metricSummary:
 *                     OSA: 0
 *                     Sos: 0
 *                     PGC: 0
 *                   imageUrl: "https://skool-search.s3.ap-south-1.amazonaws.com/images/1752216211453_family.jfif"
 *                   belongsTo: "686f9907118f04da978015dd"
 *                   createdAt: "2025-07-11T06:43:31.679Z"
 *                   updatedAt: "2025-07-11T06:43:31.679Z"
 *                   __v: 0
 *                 - _id: "64f8b5e4c68a4b4e9b9c218b"
 *                   location:
 *                     type: Point
 *                     coordinates: [73.8567, 18.5204]
 *                   captureDateTime: "2025-07-09T17:40:00.000Z"
 *                   status: In-Progress
 *                   metricSummary:
 *                     OSA: 0
 *                     Sos: 0
 *                     PGC: 12
 *                   imageUrl: "https://skool-search.s3.ap-south-1.amazonaws.com/images/1752145999999_TrainStation.jpg"
 *                   belongsTo: "686f9907118f04da978015dd"
 *                   createdAt: "2025-07-09T18:05:44.129Z"
 *                   updatedAt: "2025-07-09T18:05:44.129Z"
 *                   __v: 0
 *                 - _id: "64f8b9e4c68a4b4e9b9c218c"
 *                   location:
 *                     type: Point
 *                     coordinates: [77.1025, 28.7041]
 *                   captureDateTime: "2025-07-08T15:25:14.000Z"
 *                   status: Processed
 *                   metricSummary:
 *                     OSA: 55
 *                     Sos: 21
 *                     PGC: 37
 *                   imageUrl: "https://skool-search.s3.ap-south-1.amazonaws.com/images/1752145998888_CrowdView.png"
 *                   belongsTo: "686f9907118f04da978015dd"
 *                   createdAt: "2025-07-08T16:30:10.991Z"
 *                   updatedAt: "2025-07-08T16:30:10.991Z"
 *                   __v: 0
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *       500:
 *         description: Internal server error while fetching images
 */

/**
 * @swagger
 * /api/image/deleteImage/{imageId}:
 *   delete:
 *     summary: Delete an image by ID
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       400:
 *         description: Missing image ID
 *       404:
 *         description: Image not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error while deleting image
 */


// IMP. Front-end Should give Time in UTC Format which is equal to Indian Time.
router.post("/uploadImage", jwt.authenticateJWT, uploadFile.single("image"), async (req, res) => {
  try {
    const result = await imageController.uploadImage(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// IMP. Front-end will recieve time in UTC, So front needs to parse to show time in indian format
router.get("/getAllImages", jwt.authenticateJWT, async (req, res) => {
  try {
    const result = await imageController.getAllImages(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/deleteImage/:imageId", jwt.authenticateJWT, async (req, res) => {
  try {
    const result = await imageController.deleteImage(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
})


module.exports = router;
