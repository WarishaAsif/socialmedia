
const express = require("express");
const multer = require("multer");
const path = require("path");

const Post = require("../models/post");
const Comment = require("../models/comment");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

console.log("POSTS.JS LOADED");

// =========================
// IMAGE UPLOAD SETUP
// =========================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    }
});

// =========================
// CREATE POST
// =========================

router.post(
    "/",
    authMiddleware,

    // TEMPORARILY AUTH DISABLED FOR IMAGE TEST
    (req, res, next) => {

        upload.single("image")(
            req,
            res,
            (error) => {

                if (error) {
                    console.error(
                        "MULTER UPLOAD ERROR:",
                        error.message
                    );

                    return res.status(400).json({
                        message: error.message
                    });
                }

                // Make sure req.body always exists
                req.body = req.body || {};

                next();
            }
        );
    },

    async (req, res) => {

        try {

            console.log("POST REQUEST RECEIVED");

            console.log(
                "REQ BODY:",
                req.body
            );

            console.log(
                "REQ FILE:",
                req.file
                    ? req.file.filename
                    : "NO FILE"
            );

            const content =
                req.body?.content?.trim() || "";

            const image =
                req.file
                    ? `/uploads/${req.file.filename}`
                    : "";

            console.log(
                "POST CONTENT:",
                content
            );

            console.log(
                "UPLOADED FILE:",
                req.file
                    ? req.file.filename
                    : "NO IMAGE"
            );

            if (!content && !image) {

                return res.status(400).json({
                    message:
                        "Write something or upload an image."
                });
            }

            const post =
                await Post.create({
                    user: req.userId,
                    content,
                    image
                });

            const populatedPost =
                await Post.findById(post._id)
                    .populate(
                        "user",
                        "name profilePicture"
                    );

            console.log(
                "POST CREATED:",
                post._id.toString()
            );

            res.status(201).json(
                populatedPost
            );

        } catch (error) {

            console.error(
                "CREATE POST ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);

// =========================
// GET POSTS
// =========================

router.get("/", async (req, res) => {

    try {

        const posts =
            await Post.find()
                .populate(
                    "user",
                    "name profilePicture"
                )
                .sort({
                    createdAt: -1
                });

        res.json(posts);

    } catch (error) {

        console.error(
            "GET POSTS ERROR:",
            error
        );

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// =========================
// DELETE POST
// =========================

router.delete(
    "/:id",
    authMiddleware,

    async (req, res) => {

        try {

            const post =
                await Post.findById(
                    req.params.id
                );

            if (!post) {

                return res.status(404).json({
                    message: "Post not found"
                });
            }

            if (
                post.user.toString() !==
                req.userId
            ) {

                return res.status(403).json({
                    message:
                        "You can only delete your own post"
                });
            }

            await Comment.deleteMany({
                post: post._id
            });

            await post.deleteOne();

            res.json({
                message:
                    "Post deleted successfully"
            });

        } catch (error) {

            console.error(
                "DELETE POST ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);

// =========================
// LIKE / UNLIKE POST
// =========================

router.post(
    "/:id/like",
    authMiddleware,

    async (req, res) => {

        try {

            const post =
                await Post.findById(
                    req.params.id
                );

            if (!post) {

                return res.status(404).json({
                    message: "Post not found"
                });
            }

            const userId = req.userId;

            const alreadyLiked =
                post.likes.some(
                    id =>
                        id.toString() ===
                        userId
                );

            if (alreadyLiked) {

                post.likes =
                    post.likes.filter(
                        id =>
                            id.toString() !==
                            userId
                    );

            } else {

                post.likes.push(userId);
            }

            await post.save();

            res.json({
                liked: !alreadyLiked,
                likes: post.likes.length
            });

        } catch (error) {

            console.error(
                "LIKE ERROR:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);

module.exports = router;
