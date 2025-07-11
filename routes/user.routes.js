const router = require("express").Router();
const userController = require("../controllers/user.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile and details management
 */

/**
 * @swagger
 * /api/user/updateUser:
 *   put:
 *     summary: Update user profile (name, email, and profile picture)
 *     tags: [User]
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
 *                 example: "Aakash Mehta"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "aakash@example.com"
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/getAllDetails:
 *   get:
 *     summary: Get full details of the authenticated user
 *     tags: [User]
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
 *                   example: "User details fetched successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   description: User object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
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