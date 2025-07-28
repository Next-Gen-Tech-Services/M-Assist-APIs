const AuthRouter = require("./auth.routes");
const ImageRouter = require("./image.routes");
const UserRouter = require("./user.routes");
const ShelfRouter = require("./shelf.router");
const AdminRouter = require("./admin.router.js");

module.exports = {
  AuthRouter,
  AdminRouter,
  ImageRouter,
  UserRouter,
  ShelfRouter
};
