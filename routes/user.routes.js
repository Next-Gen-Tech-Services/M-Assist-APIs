const router = require("express").Router();
const userController = require("../controllers/user.controller");
const jwt = require("../middlewares/auth.middleware");
const { uploadFile } = require("../utils/helpers/files.util");

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