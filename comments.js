const express = require("express");
const Comment = require("../models/comment");
const Post = require("../models/post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ADD COMMENT
router.post("/:postId", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment text is required"
            });
        }

        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const comment = await Comment.create({
            post: post._id,
            user: req.userId,
            text: text.trim()
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate("user", "name profilePicture");

        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// GET COMMENTS FOR A POST
router.get("/:postId", async (req, res) => {
    try {
        const comments = await Comment.find({
            post: req.params.postId
        })
            .populate("user", "name profilePicture")
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// DELETE OWN COMMENT
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only delete your own comment"
            });
        }

        await comment.deleteOne();

        res.json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;