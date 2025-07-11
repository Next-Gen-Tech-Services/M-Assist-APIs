const userDAO = require("../daos/user.dao");
const log = require("../configs/logger.config");
const { s3 } = require("../configs/aws.config");


class UserService {
    async getAllDetailsService(req, res) {
        try {
            const user = await userDAO.getUser(req.userId);

            if (!user.data) {
                return res.status(user.code || 404).json({
                    message: user.message || "User not found",
                    status: user.status || "fail",
                    code: user.code || 404,
                    data: null,
                });
            }

            return res.status(200).json({
                message: "User details fetched successfully",
                status: "success",
                code: 200,
                data: user.data,
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

            // Check if email already exists (excluding current user)
            if (email) {
                const normalizedEmail = email.toLowerCase().trim();
                const emailExists = await userDAO.isEmailExists(normalizedEmail, userId);
                if (emailExists?.data) {
                    return res.status(409).json({
                        message: "Email already exists. Update aborted.",
                        status: "failed",
                        code: 409,
                    });
                }
            }

            // Prepare update data
            const updateData = {};
            if (name) updateData.name = name.trim();
            if (email) updateData.email = email.toLowerCase().trim();

            let uploadedKey = null;

            // If file exists, upload to S3 and update profilePic
            if (file) {
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
                uploadedKey = s3UploadParams.Key; // store the key in case we need to delete it
            }

            // Update user in DB
            const updatedUser = await userDAO.updateUserProfile(userId, updateData);

            if (!updatedUser.data) {
                // Cleanup uploaded S3 file if DB update fails
                if (uploadedKey) {
                    s3.deleteObject(
                        {
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: uploadedKey,
                        },
                        (err, data) => {
                            if (err) {
                                log.error("Failed to cleanup S3 image:", err);
                            } else {
                                log.info("Orphan S3 image deleted after DB failure");
                            }
                        }
                    );
                }

                return res.status(updatedUser.code || 500).json({
                    message: updatedUser.message || "User update failed",
                    status: updatedUser.status || "error",
                    code: updatedUser.code || 500,
                    data: null,
                });
            }

            return res.status(200).json({
                message: "User profile updated successfully",
                data: updatedUser.data,
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