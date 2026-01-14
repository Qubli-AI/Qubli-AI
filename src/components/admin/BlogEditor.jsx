import { useState, useEffect } from "react";
import { X, Save, Eye, Layout } from "lucide-react";
import ReactMarkdown from "react-markdown";

import blogService from "../../services/blogService";
import { toast } from "react-toastify";

const BlogEditor = ({ blog, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    tags: "",
    readTime: "5 min read",
    isPublished: false,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        image: blog.image || "",
        tags: blog.tags ? blog.tags.join(", ") : "",
        readTime: blog.readTime || "5 min read",
        isPublished: blog.isPublished || false,
      });
    }
  }, [blog]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSlugGen = () => {
    const generatedSlug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug: generatedSlug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((t) => t),
      };

      if (blog && blog._id) {
        await blogService.updateBlog(blog._id, dataToSubmit);
        toast.success("Blog updated successfully");
      } else {
        await blogService.createBlog(dataToSubmit);
        toast.success("Blog created successfully");
      }
      onSave(); // Refresh list
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error saving blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-border">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold">
            {blog ? "Edit Blog" : "Create New Blog"}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                previewMode
                  ? "bg-primary/20 text-primary"
                  : "text-textMuted hover:bg-surfaceHighlight"
              }`}
            >
              {previewMode ? <Layout size={18} /> : <Eye size={18} />}
              {previewMode ? "Edit" : "Preview"}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surfaceHighlight rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {previewMode ? (
            <div className="prose prose-lg dark:prose-invert max-w-none mx-auto">
              <h1>{formData.title}</h1>
              {formData.image && (
                <img
                  src={formData.image}
                  alt={formData.title}
                  className="w-full h-64 object-cover rounded-xl my-4"
                />
              )}
              <ReactMarkdown>{formData.content}</ReactMarkdown>
            </div>
          ) : (
            <form
              id="blog-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={!formData.slug ? handleSlugGen : null}
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Featured Image URL
                  </label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border">
                  <input
                    type="checkbox"
                    name="isPublished"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="isPublished"
                    className="font-medium cursor-pointer"
                  >
                    Publish Immediately
                  </label>
                </div>
              </div>

              <div className="h-full flex flex-col">
                <label className="block text-sm font-medium mb-1">
                  Content (Markdown)
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="flex-1 w-full px-4 py-4 rounded-lg bg-surface border border-border focus:ring-2 focus:ring-primary outline-none font-mono text-sm leading-relaxed resize-none"
                  required
                  placeholder="# Hello World..."
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-surface/30">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border hover:bg-surfaceHighlight transition-colors"
          >
            Cancel
          </button>
          {!previewMode && (
            <button
              type="submit"
              form="blog-form"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Save Blog
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
