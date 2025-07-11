const userDAO = require("../daos/user.dao");
const log = require("../configs/logger.config");
const { s3 } = require("../configs/aws.config");


class UserService {
    async getAllDetailsService(req, res) {
        try {
            const user = await userDAO.getUser(req.userId);

            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                    status: "fail",
                    code: 404,
                    data: null,
                });
            }

            return res.status(200).json({
                message: "User details fetched successfully",
                status: "success",
                code: 200,
                data: user,
            });
        } catch (error) {
            log.error("[User SERVICE]: getAllDetailsService failed", error);
            return res.status(500).json({
                message: "Internal server error",
                status: "error",
                code: 500,
                data: null,
            });
        }
    }
    async updateUserService(req, res) {
        // Here Make Sure front-end disabled the mobile number edit feature,
        // because in our app it act like primary or unique attribute to find
        // which should be unique
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({
                    message: "Unauthorized: Missing userId",
                    status: "failed",
                    code: 401,
                });
            }

            const { fullName, email } = req.body;
            const file = req.file;

            if (email) {
                const emailExists = await userDAO.isEmailExists(email.trim(), userId);
                if (emailExists) {
                    return res.status(409).json({
                        message: "Email already exists. Update aborted.",
                        status: "failed",
                        code: 409,
                    });
                }
            }

            const updateData = {};
            if (fullName) updateData.fullName = fullName.trim();
            if (email) updateData.email = email.trim();

            if (file) {
                // S3 Upload only if file exists and email check passed
                const s3UploadParams = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `profilePics/${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: "public-read",
                };

                const s3UploadResult = await new Promise((resolve, reject) => {
                    s3.upload(s3UploadParams, (err, data) => {
                        if (err) return reject(err);
                        resolve(data);
                    });
                });

                updateData.profilePic = s3UploadResult.Location;
            }

            const updatedUser = await userDAO.updateUserProfile(userId, updateData);

            return res.status(200).json({
                message: "User profile updated successfully",
                data: updatedUser,
                status: "success",
                code: 200,
            });
        } catch (error) {
            log.error("Error in [updateUserService]:", error);
            return res.status(500).json({
                message: "Internal Server Error",
                status: "failed",
                code: 500,
            });
        }
    }
}

module.exports = new UserService();
