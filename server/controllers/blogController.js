import Blog from "../models/Blog.js";

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public (published only) or Admin (all)
export const getAllBlogs = async (req, res) => {
  try {
    const { role } = req.query; // Simple role check check passed from frontend or middleware if needed, but safer to rely on req.user from auth middleware if we had it here globally.
    // However, for this public endpoint, we might not always have a token.
    // Strategy: If 'isAdmin' query param is present AND user is actually authenticated as admin (handled by separate admin route or conditional logic), return all.
    // For simplicity/security:
    // 1. /api/blogs (Public) -> returns only isPublished: true
    // 2. /api/admin/blogs (Admin) -> returns all (We can make a separate route or handle via middleware)

    // Let's stick to: Public route returns published. Admin route (managed in adminRoutes or here with check) returns all.
    // Actually, let's just return published by default.
    // Admin dashboard will use a specific endpoint or we check req.user if available (optional auth).

    // Note: protect middleware might not be on the public GET route.

    const query = { isPublished: true };
    const blogs = await Blog.find(query)
      .populate("author", "name picture")
      .sort({ publishedAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs" });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate(
      "author",
      "name picture"
    );

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Increment views
    blog.views += 1;
    await blog.save({ validateBeforeSave: false });

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog" });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      tags,
      readTime,
      isPublished,
    } = req.body;

    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res
        .status(400)
        .json({ message: "Blog with this slug already exists" });
    }

    const blog = new Blog({
      title,
      slug,
      excerpt,
      content,
      image,
      tags,
      readTime,
      isPublished,
      publishedAt: isPublished ? Date.now() : null,
      author: req.userId, // From protect middleware
    });

    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating blog" });
  }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      image,
      tags,
      readTime,
      isPublished,
    } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.title = title || blog.title;
    blog.slug = slug || blog.slug;
    blog.excerpt = excerpt || blog.excerpt;
    blog.content = content || blog.content;
    blog.image = image || blog.image;
    blog.tags = tags || blog.tags;
    blog.readTime = readTime || blog.readTime;

    // Handle publishing date logic
    if (isPublished !== undefined) {
      if (isPublished && !blog.isPublished) {
        blog.publishedAt = Date.now(); // Newly published
      }
      blog.isPublished = isPublished;
    }

    const updatedBlog = await blog.save();
    res.status(200).json(updatedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error updating blog" });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.deleteOne();
    res.status(200).json({ message: "Blog removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting blog" });
  }
};

// @desc    Get all blogs (Admin view - includes drafts)
// @route   GET /api/blogs/admin/all
// @access  Private/Admin
export const getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .populate("author", "name picture")
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin blogs" });
  }
};
