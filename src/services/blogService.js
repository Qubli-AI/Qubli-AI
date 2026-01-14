import axios from "axios";

// Using the existing axios instance or creating a new one if not globally configured.
// Assuming there is a configured axios instance or we use default axios.
// Based on typical patterns, we might rely on the token being in localStorage or cookies.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthHeader = () => {
  // Prioritize adminToken for admin operations, fallback to user token
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
};

const blogService = {
  // Get all blogs (Public - Published only)
  getAllBlogs: async () => {
    const response = await axios.get(`${API_URL}/api/blogs`);
    return response.data;
  },

  // Get single blog by slug
  getBlogBySlug: async (slug) => {
    const response = await axios.get(`${API_URL}/api/blogs/${slug}`);
    return response.data;
  },

  // Get all blogs (Admin - All)
  getAdminBlogs: async () => {
    const response = await axios.get(
      `${API_URL}/api/blogs/admin/all`,
      getAuthHeader()
    );
    return response.data;
  },

  // Create blog
  createBlog: async (blogData) => {
    const response = await axios.post(
      `${API_URL}/api/blogs`,
      blogData,
      getAuthHeader()
    );
    return response.data;
  },

  // Update blog
  updateBlog: async (id, blogData) => {
    const response = await axios.put(
      `${API_URL}/api/blogs/${id}`,
      blogData,
      getAuthHeader()
    );
    return response.data;
  },

  // Delete blog
  deleteBlog: async (id) => {
    const response = await axios.delete(
      `${API_URL}/api/blogs/${id}`,
      getAuthHeader()
    );
    return response.data;
  },
};

export default blogService;
