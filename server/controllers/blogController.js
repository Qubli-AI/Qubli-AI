import Blog from "../models/Blog.js";

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public (published only)
export const getAllBlogs = async (_, res) => {
  try {
    const query = { isPublished: true };
    const blogs = await Blog.find(query)
      .populate("author", "name picture")
      .sort({ publishedAt: -1 });

    res.status(200).json(blogs);
  } catch {
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

    // Real View Tracking System (Cookie-based, 1 hour expiry)
    const cookieName = `viewed_blog_${blog._id}`;
    const cookies =
      req.headers.cookie?.split(";").reduce((acc, c) => {
        const [key, val] = c.trim().split("=");
        acc[key] = val;
        return acc;
      }, {}) || {};

    if (!cookies[cookieName]) {
      // Increment views if cookie doesn't exist
      blog.views += 1;
      await blog.save({ validateBeforeSave: false });

      // Set cookie for 1 hour
      res.setHeader(
        "Set-Cookie",
        `${cookieName}=true; Max-Age=3600; HttpOnly; Path=/; SameSite=Lax`
      );
    }

    res.status(200).json(blog);
  } catch {
    res.status(500).json({ message: "Error fetching blog" });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req, res) => {
  try {
    const { title, slug, excerpt, content, image, tags, isPublished } =
      req.body;

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
    const { title, slug, excerpt, content, image, tags, isPublished } =
      req.body;

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

    // Handle publishing date logic
    if (isPublished !== undefined) {
      if (isPublished && !blog.isPublished) {
        blog.publishedAt = Date.now(); // Newly published
      }
      blog.isPublished = isPublished;
    }

    await blog.save();
    const updatedBlog = await Blog.findById(blog._id).populate(
      "author",
      "name picture"
    );
    res.status(200).json(updatedBlog);
  } catch {
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
  } catch {
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
      .sort({ views: -1, createdAt: -1 });

    res.status(200).json(blogs);
  } catch {
    res.status(500).json({ message: "Error fetching admin blogs" });
  }
};
