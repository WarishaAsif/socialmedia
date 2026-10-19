const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const commentRoutes = require("./routes/comments");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Uploaded images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

// TEST USERS ROUTE
app.get("/test-users", (req, res) => {
    res.json({
        message: "TEST USERS ROUTE WORKING"
    });
});

// ROOT
app.get("/", (req, res) => {
    res.json({
        message: "Social Media API is running!"
    });
});

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB Connection Error:",
            error.message
        );
    });