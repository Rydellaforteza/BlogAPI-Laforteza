const Blog = require("../models/Blog");


function clean(blog) {
  blog = blog.toObject();
  delete blog.__v;

  // Author (KEEP _id AND username)
  if (blog.userId && blog.userId.username) {
    blog.author = {
      _id: blog.userId._id.toString(),
      username: blog.userId.username
    };
  }
  delete blog.userId;

  // Comments (also keep _id + username)
  if (blog.comments && blog.comments.length > 0) {
    blog.comments = blog.comments.map(c => {
      if (typeof c.toObject === "function") c = c.toObject();
      delete c.__v;

      if (c.userId && c.userId.username) {
        c.author = {
          _id: c.userId._id.toString(),
          username: c.userId.username
        };
      }

      delete c.userId;
      return c;
    });
  }

  return blog;
}



exports.createBlog = (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const blogData = {
    title,
    content,
    userId: req.user.id,
    comments: []
  };

  Blog.create(blogData)
    .then(blog => {
      return res.status(201).json({
        message: "Blog created successfully",
        blog: clean(blog)
      });
    })
    .catch(err => {
      console.error("Blog creation error:", err);
      return res.status(500).json({ message: "Cannot create blog" });
    });
};


exports.getAllBlogs = (req, res) => {
  Blog.find()
    .populate("userId", "username")
    .populate("comments.userId", "username")
    .then(blogs => res.status(200).json(blogs.map(clean)))
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.getBlog = (req, res) => {
  Blog.findById(req.params.blogId)
    .populate("userId", "username")
    .populate("comments.userId", "username")
    .then(blog => {
      if (!blog) return res.status(404).json({ message: "Blog not found" });
      return res.status(200).json(clean(blog));
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.updateBlog = (req, res) => {
  Blog.findById(req.params.blogId)
    .then(blog => {
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      const isAdmin = req.user.isAdmin === true;
      const isOwner = req.user.id === String(blog.userId);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          message: "Only the blog author or an admin can update this blog"
        });
      }

      Blog.findByIdAndUpdate(req.params.blogId, req.body, { new: true })
        .populate("userId", "username")
        .populate("comments.userId", "username")
        .then(updatedBlog => {
          return res.status(200).json({
            message: "Blog updated",
            blog: clean(updatedBlog)
          });
        });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.deleteBlog = (req, res) => {
  Blog.findById(req.params.blogId)
    .then(blog => {
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      const isAdmin = req.user.isAdmin === true;
      const isOwner = req.user.id === String(blog.userId);

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          message: "Only the blog author or an admin can delete this blog"
        });
      }

      return Blog.findByIdAndDelete(req.params.blogId)
        .then(() => res.status(200).json({ message: "Blog deleted" }));
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    });
};


exports.addComment = (req, res) => {
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  Blog.findById(req.params.blogId)
    .then(blog => {
      if (!blog) return res.status(404).json({ message: "Blog not found" });

      blog.comments.push({
        userId: req.user.id,
        comment,
        createdAt: new Date()
      });

      blog.save().then(() => {
        Blog.findById(req.params.blogId)
          .populate("userId", "username")
          .populate("comments.userId", "username")
          .then(updatedBlog => {
            return res.status(201).json({
              message: "Comment added",
              blogId: updatedBlog._id,
              comments: clean(updatedBlog).comments
            });
          });
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    });
};




exports.deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId)
      .populate("userId", "username")
      .populate("comments.userId", "username");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const isAdmin = req.user.isAdmin === true;
    const isOwner = req.user.id === String(blog.userId._id); // blog owner

    const comment = blog.comments.id(req.params.commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    const isCommentOwner =
      String(comment.userId._id || comment.userId) === req.user.id;

    if (!isAdmin && !isOwner && !isCommentOwner) {
      return res.status(403).json({
        message:
          "Only admin, blog owner, or comment owner can delete comments",
      });
    }

    // ------------------------------
    // FIX: Use pull instead of remove()
    // ------------------------------
    blog.comments.pull(comment._id);

    await blog.save();

    return res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

