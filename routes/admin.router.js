const router = require("express").Router();
const jwt = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

// /api/admin/dasboard GET Type pending need to ask Ankit Sir
router.get("/dashboard", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.dashboard(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/get-all-sheleves", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.getAllSheleves(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// if more APIs on user action by admin, then following routes should be in separate file
router.patch("/user/toggle-status/:userId", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.toggleUserStatus(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/user/delete-user/:userId", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.deleteUser(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/user/get-all-users", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.getAllUsers(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


// if more APIs on image action by admin, then following routes should be separte file
router.get("/image/get-all-images", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.getAllImages(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
