let selectedImageFile = null;

const API = "http://localhost:5000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

let cameraStream = null;


// =========================
// PAGE START
// =========================

document.addEventListener("DOMContentLoaded", () => {

    setupImageUpload();

    if (token && currentUser) {
        showApp();
        loadPosts();
    } else {
        showAuth();
    }
});


// =========================
// IMAGE UPLOAD
// =========================

function setupImageUpload() {

    const galleryInput = document.getElementById("postImage");

    if (galleryInput) {
        galleryInput.addEventListener("change", handleImageSelect);
    }
}


function handleImageSelect(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB.");
        event.target.value = "";
        return;
    }

    selectedImageFile = file;

    showImagePreview(file);
}


// =========================
// IMAGE PREVIEW
// =========================

function showImagePreview(file) {

    const preview = document.getElementById("imagePreview");

    if (!preview) return;

    if (preview.dataset.objectUrl) {
        URL.revokeObjectURL(preview.dataset.objectUrl);
    }

    const previewURL = URL.createObjectURL(file);

    preview.dataset.objectUrl = previewURL;

    preview.innerHTML = `
        <div class="preview-container">

            <img
                src="${previewURL}"
                alt="Image Preview"
            >

            <button
                type="button"
                class="remove-image-btn"
                onclick="clearSelectedImage()"
            >
                ✕ Remove
            </button>

        </div>
    `;
}


// =========================
// CLEAR IMAGE
// =========================

function clearSelectedImage() {

    selectedImageFile = null;

    const galleryInput = document.getElementById("postImage");
    const preview = document.getElementById("imagePreview");

    if (galleryInput) {
        galleryInput.value = "";
    }

    if (preview) {

        if (preview.dataset.objectUrl) {
            URL.revokeObjectURL(preview.dataset.objectUrl);
        }

        preview.dataset.objectUrl = "";
        preview.innerHTML = "";
    }
}


// =========================
// LIVE CAMERA
// =========================

async function openCamera() {

    const cameraBox = document.getElementById("cameraBox");
    const video = document.getElementById("cameraVideo");

    if (!cameraBox || !video) {
        alert("Camera section is missing from HTML.");
        return;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        alert("Camera is not supported by this browser.");
        return;
    }

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                }
            },
            audio: false
        });

        video.srcObject = cameraStream;

        cameraBox.style.display = "block";

        await video.play();

    } catch (error) {

        console.error("Camera Error:", error);

        if (error.name === "NotAllowedError") {
            alert("Camera permission was denied. Please allow camera access.");
        } else if (error.name === "NotFoundError") {
            alert("No camera was found on this device.");
        } else {
            alert("Unable to access camera.");
        }
    }
}


// =========================
// TAKE PHOTO
// =========================

function takePhoto() {

    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");

    if (!video || !canvas) {
        alert("Camera elements are missing.");
        return;
    }

    if (
        video.readyState < 2 ||
        !video.videoWidth ||
        !video.videoHeight
    ) {
        alert("Camera is not ready yet.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
        alert("Unable to capture photo.");
        return;
    }

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(
        function (blob) {

            if (!blob) {
                alert("Unable to capture photo.");
                return;
            }

            const file = new File(
                [blob],
                `camera-${Date.now()}.jpg`,
                {
                    type: "image/jpeg"
                }
            );

            selectedImageFile = file;

            showImagePreview(file);

            closeCamera();
        },
        "image/jpeg",
        0.9
    );
}


// =========================
// CLOSE CAMERA
// =========================

function closeCamera() {

    const cameraBox = document.getElementById("cameraBox");
    const video = document.getElementById("cameraVideo");

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {
            track.stop();
        });

        cameraStream = null;
    }

    if (video) {
        video.srcObject = null;
    }

    if (cameraBox) {
        cameraBox.style.display = "none";
    }
}


// =========================
// AUTH UI
// =========================

function showAuth() {

    document.getElementById("authSection").style.display = "flex";
    document.getElementById("appSection").style.display = "none";
}


function showApp() {

    document.getElementById("authSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
}


function showLogin() {

    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
}


function showRegister() {

    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}


// =========================
// REGISTER
// =========================

async function register() {

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
        alert("Please fill all fields.");
        return;
    }

    try {

        const response = await fetch(
            `${API}/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Registration failed."
            );

            return;
        }

        alert(
            "Registration successful! Please login."
        );

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

        showLogin();

    } catch (error) {

        alert("Cannot connect to server.");
        console.error(error);
    }
}


// =========================
// LOGIN
// =========================

async function login() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    try {

        const response = await fetch(
            `${API}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Login failed."
            );

            return;
        }

        token = data.token;
        currentUser = data.user;

        localStorage.setItem("token", token);

        localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
        );

        showApp();
        loadPosts();

    } catch (error) {

        alert("Cannot connect to server.");
        console.error(error);
    }
}


// =========================
// LOGOUT
// =========================

function logout() {

    closeCamera();

    clearSelectedImage();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    showAuth();
    showLogin();
}


// =========================
// LOAD POSTS
// =========================

async function loadPosts() {

    try {

        const response =
            await fetch(`${API}/posts`);

        const posts =
            await response.json();

        const container =
            document.getElementById("postsContainer");

        if (!posts.length) {

            container.innerHTML = `
                <div class="post-card">
                    <p>
                        No posts yet.
                        Be the first to post!
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        posts.forEach(post => {

            container.innerHTML +=
                createPostHTML(post);

            loadComments(post._id);
        });

    } catch (error) {

        console.error(error);

        document.getElementById(
            "postsContainer"
        ).innerHTML = `
            <div class="post-card">
                <p>
                    Unable to load posts.
                </p>
            </div>
        `;
    }
}


// =========================
// POST HTML
// =========================

function createPostHTML(post) {

    const name =
        post.user?.name ||
        "Unknown User";

    const firstLetter =
        name.charAt(0).toUpperCase();

    const date =
        new Date(post.createdAt).toLocaleString();

    const isLiked =
        post.likes?.some(
            id =>
                id.toString() ===
                currentUser?.id
        );

    const imageHTML =
        post.image
            ? `
                <div class="post-image">

                    <img
                        src="http://localhost:5000${post.image}"
                        alt="Post image"
                        loading="lazy"
                    >

                </div>
            `
            : "";

    const contentHTML =
        post.content
            ? `
                <div class="post-content">
                    ${escapeHTML(post.content)}
                </div>
            `
            : "";

    return `
        <article class="post-card">

            <div class="post-header">

                <div class="profile-avatar">
                    ${firstLetter}
                </div>

                <div>

                    <div class="post-user">
                        ${escapeHTML(name)}
                    </div>

                    <div class="post-date">
                        ${date}
                    </div>

                </div>

            </div>

            ${contentHTML}

            ${imageHTML}

            <div class="post-actions">

                <button
                    onclick="likePost('${post._id}')"
                >
                    ${isLiked ? "❤️" : "♡"}
                    ${post.likes?.length || 0}
                </button>

                <button
    type="button"
    onclick="toggleComments('${post._id}')"
>
    💬 Comments
</button>

                ${
                    currentUser &&
                    post.user?._id === currentUser.id
                        ? `
                            <button
                                onclick="deletePost('${post._id}')"
                            >
                                🗑 Delete
                            </button>
                        `
                        : ""
                }

            </div>

            <div
                id="comments-${post._id}"
                class="comments"
                style="display:none;"
            >

                <div id="commentList-${post._id}">
                    Loading comments...
                </div>

                <div class="comment-form">

                    <input
                        type="text"
                        id="commentInput-${post._id}"
                        placeholder="Write a comment..."
                    >

                    <button
                        onclick="addComment('${post._id}')"
                    >
                        Send
                    </button>

                </div>

            </div>

        </article>
    `;
}


// =========================
// CREATE POST
// =========================

async function createPost() {

    const content =
        document.getElementById(
            "postContent"
        ).value.trim();

    const imageInput =
        document.getElementById(
            "postImage"
        );

    let imageFile =
        selectedImageFile;

    if (
        !imageFile &&
        imageInput?.files?.length
    ) {
        imageFile =
            imageInput.files[0];
    }

    if (!content && !imageFile) {

        alert(
            "Write something or select an image."
        );

        return;
    }

    try {

        const formData =
            new FormData();

        formData.append(
            "content",
            content
        );

        if (imageFile) {

            formData.append(
                "image",
                imageFile
            );
        }

        const response =
            await fetch(
                `${API}/posts`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: formData
                }
            );

        const text =
            await response.text();

        if (!response.ok) {

            alert(
                `Server Error ${response.status}: ${text}`
            );

            return;
        }

        document.getElementById(
            "postContent"
        ).value = "";

        clearSelectedImage();

        await loadPosts();

    } catch (error) {

        console.error(
            "CREATE POST ERROR:",
            error
        );

        alert(
            "Cannot connect to server."
        );
    }
}


// =========================
// LIKE POST
// =========================

async function likePost(postId) {

    try {

        const response =
            await fetch(
                `${API}/posts/${postId}/like`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to like post."
            );

            return;
        }

        loadPosts();

    } catch (error) {

        console.error(error);
    }
}


// =========================
// DELETE POST
// =========================

async function deletePost(postId) {

    if (!confirm("Delete this post?")) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/posts/${postId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete post."
            );

            return;
        }

        loadPosts();

    } catch (error) {

        console.error(error);
    }
}


// =========================
// COMMENTS
// =========================

async function loadComments(postId) {

    try {

        const response =
            await fetch(
                `${API}/comments/${postId}`
            );

        const comments =
            await response.json();

        const container =
            document.getElementById(
                `commentList-${postId}`
            );

        if (!container) return;

        if (!comments.length) {

            container.innerHTML = `
                <p
                    style="
                        color:#9ca3af;
                        font-size:13px;
                    "
                >
                    No comments yet.
                </p>
            `;

            return;
        }

        container.innerHTML =
            comments.map(comment => {

                const canDelete =
                    currentUser &&
                    comment.user?._id ===
                    currentUser.id;

                return `
                    <div class="comment">

                        <strong>
                            ${escapeHTML(
                                comment.user?.name ||
                                "User"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                comment.text
                            )}
                        </p>

                        ${
                            canDelete
                                ? `
                                    <button
                                        onclick="deleteComment('${comment._id}')"
                                        style="
                                            color:#dc2626;
                                            background:none;
                                            padding:0;
                                            margin-top:5px;
                                            font-size:12px;
                                        "
                                    >
                                        Delete
                                    </button>
                                `
                                : ""
                        }

                    </div>
                `;
            }).join("");

    } catch (error) {

        console.error(error);
    }
}


function toggleComments(postId) {

    const comments =
        document.getElementById(
            `comments-${postId}`
        );

    if (!comments) return;

    if (comments.style.display === "none") {

        comments.style.display = "block";

        loadComments(postId);

    } else {

        comments.style.display = "none";
    }
}


async function addComment(postId) {

    const input =
        document.getElementById(
            `commentInput-${postId}`
        );

    const text =
        input.value.trim();

    if (!text) return;

    try {

        const response =
            await fetch(
                `${API}/comments/${postId}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        text
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to add comment."
            );

            return;
        }

        input.value = "";

        loadComments(postId);

    } catch (error) {

        console.error(error);
    }
}


async function deleteComment(commentId) {

    if (!confirm("Delete this comment?")) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/comments/${commentId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete comment."
            );

            return;
        }

        loadPosts();

    } catch (error) {

        console.error(error);
    }
}


// =========================
// HOME
// =========================

function showFeed() {

    document.getElementById(
        "profileSection"
    ).style.display = "none";

    document.getElementById(
        "discoverSection"
    ).style.display = "none";

    document.getElementById(
        "feedSection"
    ).style.display = "block";

    document.querySelector(
        ".create-post"
    ).style.display = "block";

    loadPosts();
}


// =========================
// MY PROFILE
// =========================

function showMyProfile() {

    if (!currentUser) return;

    showProfile(currentUser.id);
}


// =========================
// USER PROFILE
// =========================

async function showProfile(userId) {

    try {

        const response =
            await fetch(
                `${API}/users/${userId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load profile."
            );

            return;
        }

        document.getElementById(
            "feedSection"
        ).style.display = "none";

        document.getElementById(
            "discoverSection"
        ).style.display = "none";

        document.querySelector(
            ".create-post"
        ).style.display = "none";

        const profileSection =
            document.getElementById(
                "profileSection"
            );

        profileSection.style.display =
            "block";

        const isMyProfile =
            currentUser &&
            currentUser.id ===
            data.user._id;

        const alreadyFollowing =
            currentUser &&
            data.user.followers.some(
                id =>
                    id.toString() ===
                    currentUser.id
            );

        profileSection.innerHTML = `

            <div class="profile-card">

                <div class="profile-avatar">
                    ${data.user.name
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <h1>
                    ${escapeHTML(
                        data.user.name
                    )}
                </h1>

                <p>
                    ${escapeHTML(
                        data.user.email
                    )}
                </p>

                <p class="profile-bio">
                    ${escapeHTML(
                        data.user.bio ||
                        "No bio added yet."
                    )}
                </p>

                <div class="profile-stats">

                    <div class="profile-stat">
                        <strong>
                            ${data.followersCount}
                        </strong>

                        <span>
                            Followers
                        </span>
                    </div>

                    <div class="profile-stat">
                        <strong>
                            ${data.followingCount}
                        </strong>

                        <span>
                            Following
                        </span>
                    </div>

                    <div class="profile-stat">
                        <strong>
                            ${data.posts.length}
                        </strong>

                        <span>
                            Posts
                        </span>
                    </div>

                </div>

                ${
                    !isMyProfile
                        ? `
                            <button
                                class="follow-btn"
                                onclick="followUser('${data.user._id}')"
                            >
                                ${
                                    alreadyFollowing
                                        ? "Unfollow"
                                        : "Follow"
                                }
                            </button>
                        `
                        : ""
                }

            </div>

            <h2>
                User Posts
            </h2>

            <div id="profilePosts"></div>
        `;

        const postsContainer =
            document.getElementById(
                "profilePosts"
            );

        if (!data.posts.length) {

            postsContainer.innerHTML = `
                <div class="post-card">
                    <p>
                        This user has no posts yet.
                    </p>
                </div>
            `;

            return;
        }

        postsContainer.innerHTML =
            data.posts
                .map(
                    post =>
                        createPostHTML(post)
                )
                .join("");

        data.posts.forEach(
            post =>
                loadComments(post._id)
        );

    } catch (error) {

        console.error(error);
    }
}


// =========================
// DISCOVER PEOPLE
// =========================

function showDiscover() {

    document.getElementById(
        "feedSection"
    ).style.display = "none";

    document.getElementById(
        "profileSection"
    ).style.display = "none";

    document.getElementById(
        "discoverSection"
    ).style.display = "block";

    document.querySelector(
        ".create-post"
    ).style.display = "none";

    loadUsers();
}


async function loadUsers() {

    try {

        const response =
            await fetch(
                `${API}/users`
            );

        const users =
            await response.json();

        const container =
            document.getElementById(
                "usersContainer"
            );

        if (!response.ok) {

            container.innerHTML = `
                <div class="post-card">
                    <p>
                        Unable to load users.
                    </p>
                </div>
            `;

            return;
        }

        const otherUsers =
            users.filter(
                user =>
                    user._id !==
                    currentUser?.id
            );

        if (!otherUsers.length) {

            container.innerHTML = `
                <div class="post-card">

                    <p>
                        No other users found yet.
                    </p>

                    <p>
                        Create another account
                        to test the Follow system.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            otherUsers
                .map(user => {

                    const firstLetter =
                        user.name
                            .charAt(0)
                            .toUpperCase();

                    const alreadyFollowing =
                        user.followers?.some(
                            id =>
                                id.toString() ===
                                currentUser?.id
                        );

                    return `
                        <div class="user-card">

                            <div class="profile-avatar">
                                ${firstLetter}
                            </div>

                            <h3>
                                ${escapeHTML(
                                    user.name
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    user.bio ||
                                    "No bio added yet."
                                )}
                            </p>

                            <div class="user-stats">

                                <span>
                                    ${
                                        user.followers
                                            ?.length || 0
                                    }
                                    Followers
                                </span>

                                <span>
                                    ${
                                        user.following
                                            ?.length || 0
                                    }
                                    Following
                                </span>

                            </div>

                            <div class="user-buttons">

                                <button
                                    onclick="showProfile('${user._id}')"
                                >
                                    View Profile
                                </button>

                                <button
                                    class="follow-btn"
                                    onclick="followUser('${user._id}')"
                                >
                                    ${
                                        alreadyFollowing
                                            ? "Unfollow"
                                            : "Follow"
                                    }
                                </button>

                            </div>

                        </div>
                    `;
                })
                .join("");

    } catch (error) {

        console.error(error);

        document.getElementById(
            "usersContainer"
        ).innerHTML = `
            <div class="post-card">
                <p>
                    Unable to load users.
                </p>
            </div>
        `;
    }
}


// =========================
// FOLLOW / UNFOLLOW
// =========================

async function followUser(userId) {

    try {

        const response =
            await fetch(
                `${API}/users/${userId}/follow`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to follow user."
            );

            return;
        }

        showProfile(userId);

    } catch (error) {

        console.error(error);
    }
}


// =========================
// SECURITY HELPER
// =========================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}