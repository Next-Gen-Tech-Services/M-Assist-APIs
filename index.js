require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const log = require("./configs/logger.config");
const { PORT, SOCKET_PORT } = require("./configs/server.config");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = require("./configs/swagger.config");
const { AuthRouter, ImageRouter, UserRouter } = require("./routes/index");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// INITIALIZING DATABASE CONNECTION
require("./configs/db.config");

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  cookieSession({
    name: "session",
    keys: ["smstrap", "session", "backend"],
    maxAge: 24 * 60 * 60 * 100,
  })
);

app.use(express.json()); //  Parse non-file fields in multipart/form-data for images

// Middleware function to trim req.body
app.use((req, res, next) => {
  // Check if the request has a body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  console.log("HTTP method is " + req.method + ", URL -" + req.url);
  next(); // Proceed to the next middleware or route handler
});



app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/image", ImageRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.listen(PORT, () => {
  // Start Express app server
  log.info(`Express server listening to the port ${PORT}`);
});
