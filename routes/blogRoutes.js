const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");
const auth = require("../auth");



// CREATE BLOG (authenticated)
router.post("/", auth.authenticate, blogController.createBlog);

// GET ALL BLOGS (public)
router.get("/", blogController.getAllBlogs);

// GET SINGLE BLOG (public)
router.get("/:blogId", blogController.getBlog);

// UPDATE BLOG (admin OR owner)
router.patch("/:blogId/edit", auth.authenticate, blogController.updateBlog);

// DELETE BLOG (admin OR owner)
router.delete("/:blogId/remove", auth.authenticate, blogController.deleteBlog);



// ADD COMMENT (authenticated)
router.post("/:blogId/comments", auth.authenticate, blogController.addComment);


// DELETE COMMENT (admin OR blog owner)
router.delete("/:blogId/comments/:commentId/remove", auth.authenticate, blogController.deleteComment);

module.exports = router;
