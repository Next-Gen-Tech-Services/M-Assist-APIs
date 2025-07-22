const router = require("express").Router();
const authController = require("../controllers/auth.controller");

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


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: User Login
 *     description: Authenticates a user using email and password and returns a JWT token on success.
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
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: MySecurePassword123
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User logged in successfully
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: "64ec99d4f3dabc0123456789"
 *                         profilePic:
 *                           type: string
 *                           example: "https://s3.amazonaws.com/bucket/user123.jpg"
 *                         fullName:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                         role:
 *                           type: string
 *                           example: creator
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *       400:
 *         description: Missing or invalid email/password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *                 status:
 *                   type: string
 *                   example: failed
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 data:
 *                   type: "null"
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password
 *                 status:
 *                   type: string
 *                   example: unauthorized
 *                 code:
 *                   type: integer
 *                   example: 401
 *                 data:
 *                   type: "null"
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Account does not exist
 *                 status:
 *                   type: string
 *                   example: not_found
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 data:
 *                   type: "null"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 *                 status:
 *                   type: string
 *                   example: error
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 data:
 *                   type: "null"
 */
router.post("/login", async (req, res) => {
  try {
    const result = await authController.login(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/forgetPassword", async (req, res) => {
  try {
    const result = await authController.forgetPassword(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/resendEmail", async (req, res) => {
  try {
    const result = await authController.resendEmail(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/resetPassword/:token", async (req, res) => {
  try {
    const result = await authController.resetPassword(req, res);
    return result;
  } catch (error) {
    log.error("Internal Server Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
