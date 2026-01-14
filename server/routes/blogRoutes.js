import express from "express";
import {
  getAllBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  getAdminBlogs,
} from "../controllers/blogController.js";
import protect from "../middleware/auth.js";
import { admin } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:slug", getBlogBySlug);

// Admin routes
router.get("/admin/all", protect, admin, getAdminBlogs);
router.post("/", protect, admin, createBlog);
router.put("/:id", protect, admin, updateBlog);
router.delete("/:id", protect, admin, deleteBlog);

export default router;
