const router = require("express").Router();
const userController = require("../controllers/user.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");
/**
 * @swagger
 * /api/user/updateUser:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user profile
 *     description: Updates the authenticated user's full name, email, and optionally their profile picture.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Aakash Sharma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: aakash@example.com
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User profile updated successfully
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized access
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.put("/updateUser", jwt.authenticateJWT, uploadFile.single("profilePic"), async (req, res) => {
    try {
        const result = await userController.updateUser(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})


/**
 * @swagger
 * /api/user/getAllDetails:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user details
 *     description: Returns the profile information of the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User details fetched successfully
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/getAllDetails", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await userController.getAllDetails(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;