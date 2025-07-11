const { JWT_SECRET } = require("../configs/server.config");
const userDao = require("../daos/user.dao");
const { verifyToken } = require("../utils/helpers/tokenHelper.util");
const jwt = require("jsonwebtoken");


class JWT {
  async authenticateJWT(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader !== null) {
        const payload = verifyToken(authHeader.split(" ")[1]);
        // console.log(payload);
        req.userId = payload.userId;
        const user = await userDao.getUser(req.userId);
        if (user && user.data) {
          log.info("Authentication token verified");
          next();
        } else {
          log.error("Error from [Auth MIDDLEWARE]: " + "User not found");
          return res.status(403).json({
            message: "Unauthorized",
            status: "failed",
            data: null,
            code: 201,
          });
        }
      } else {
        log.error(
          "Error from [Auth MIDDLEWARE]: " + "Invalid authentication token"
        );
        return res.status(403).json({
          message: "Unauthorized",
          status: "failed",
          data: null,
          code: 201,
        });
      }
    } catch (error) {
      log.error("Error from [Auth MIDDLEWARE]: " + error);
      return res.status(400).json({
        message: "Unauthorized",
        status: "failed",
        data: null,
        code: 201,
      });
    }
  }
}

module.exports = new JWT();
