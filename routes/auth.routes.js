const router = require("express").Router();
const authController = require("../controllers/auth.controller");

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user with profile picture
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - mobileNumber
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file to upload
 *               fullName:
 *                 type: string
 *                 example: Aakash Tamboli
 *               email:
 *                 type: string
 *                 format: email
 *                 example: aakash@example.com
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *               role:
 *                 type: string
 *                 enum: [field_user, admin]
 *                 example: field_user
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or missing fields
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login using email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: aakash@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Missing or invalid credentials
 *       401:
 *         description: Invalid password
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// for testing and consistency only purpose
router.post("/signup", async (req, res) => {
  try {
    const result = await authController.signup(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await authController.login(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
