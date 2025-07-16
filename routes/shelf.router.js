const router = require("express").Router();
const shelfController = require("../controllers/shelf.controller.js");
const jwt = require("../middlewares/auth.middleware");

// IMP. Front-end will recieve time in UTC, So front needs to parse to show time in indian format
/**
 * @swagger
 * /api/shelf/getAllSheleves:
 *   get:
 *     tags:
 *       - Shelf
 *     summary: Get all shelves of the authenticated user
 *     description: Fetches all shelf entries created by the logged-in user. Each shelf contains images and metric summary (OSA, SOS, PGC).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shelves fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Shelf ID
 *                       userId:
 *                         type: string
 *                       imageUrls:
 *                         type: array
 *                         items:
 *                           type: string
 *                           description: Image IDs
 *                       metricSummary:
 *                         type: object
 *                         properties:
 *                           OSA:
 *                             type: number
 *                           SOS:
 *                             type: number
 *                           PGC:
 *                             type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */

router.get("/getAllSheleves", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await shelfController.getAllSheleves(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})

/**
 * @swagger
 * /api/shelf/deleteShelf/{shelfId}:
 *   delete:
 *     tags:
 *       - Shelf
 *     summary: Delete a shelf and all its images from DB and S3
 *     description: Authenticated users can delete their shelf along with all related images from DB and S3.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shelfId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the shelf to delete
 *     responses:
 *       200:
 *         description: Shelf and images deleted successfully
 *       400:
 *         description: Missing shelfId
 *       404:
 *         description: Shelf not found or access denied
 *       500:
 *         description: Internal server error
 */
router.delete("/:shelfId", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await shelfController.deleteShelf(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})


module.exports = router;
