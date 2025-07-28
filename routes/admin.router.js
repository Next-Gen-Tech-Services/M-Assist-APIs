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

router.get("/get-all-users", jwt.authenticateJWT, async (req, res) => {
    try {
        const result = await adminController.getAllUsers(req, res);
        return result;
    } catch (error) {
        log.error("Internal Server Error: ", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
