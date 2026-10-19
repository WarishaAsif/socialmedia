
const express = require("express");
console.log("USERS ROUTE LOADED");
const User = require("../models/user");
const Post = require("../models/post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
    try {
        const users = await User.find()
            .select("name bio profilePicture followers following");

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// GET USER PROFILE
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const posts = await Post.find({
            user: user._id
        })
            .populate("user", "name profilePicture")
            .sort({ createdAt: -1 });

        res.json({
            user,
            posts,
            followersCount: user.followers.length,
            followingCount: user.following.length
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

// FOLLOW / UNFOLLOW USER
router.post("/:id/follow", authMiddleware, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (targetUser._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const alreadyFollowing = currentUser.following.some(
            id => id.toString() === targetUser._id.toString()
        );

        if (alreadyFollowing) {
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== targetUser._id.toString()
            );

            targetUser.followers = targetUser.followers.filter(
                id => id.toString() !== currentUser._id.toString()
            );
        } else {
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
        }

        await currentUser.save();
        await targetUser.save();

        res.json({
            following: !alreadyFollowing,
            followersCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;