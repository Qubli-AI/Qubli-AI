import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Edit,
  Trash2,
  EyeOff,
  Eye,
  Loader2,
  List,
} from "lucide-react";
import { toast } from "react-toastify";
import blogService from "../services/blogService";
import StorageService from "../services/storageService";
import BlogEditor from "./admin/BlogEditor";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Reading Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // TOC
  const [toc, setToc] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await blogService.getBlogBySlug(id);
        setBlog(data);

        // Extract headers for TOC from content
        if (data.content) {
          const lines = data.content.split("\n");
          const headers = lines
            .filter((line) => line.startsWith("#"))
            .map((line) => {
              const level = line.match(/^#+/)[0].length;
              const text = line.replace(/^#+\s+/, "");
              const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              return { level, text, id };
            });
          setToc(headers);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const checkAdmin = () => {
      const user = StorageService.getCurrentUser();
      setIsAdmin(user?.role === "admin");
    };

    checkAdmin();
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this blog post? This action cannot be undone."
      )
    ) {
      try {
        await blogService.deleteBlog(blog._id);
        toast.success("Blog deleted successfully");
        navigate("/blogs");
      } catch {
        toast.error("Failed to delete blog");
      }
    }
  };

  const handlePublishToggle = async () => {
    try {
      const updatedBlog = await blogService.updateBlog(blog._id, {
        isPublished: !blog.isPublished,
      });
      setBlog(updatedBlog);
      toast.success(
        `Blog ${
          updatedBlog.isPublished ? "published" : "unpublished"
        } successfully`
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-textMain">
        <h1 className="text-3xl font-bold mb-4">Blog Not Found</h1>
        <button
          onClick={() => navigate("/blogs")}
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-primary origin-left z-50"
        style={{ scaleX }}
      />

      <article className="min-h-screen pt-24 pb-0 bg-background dark:bg-gray-900 transition-colors duration-300">
        {/* Admin Control Bar */}
        {isAdmin && (
          <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
            <button
              onClick={() => setShowEditor(true)}
              className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all tooltip"
              title="Edit Blog"
            >
              <Edit size={24} />
            </button>
            <button
              onClick={handlePublishToggle}
              className={`p-3 rounded-full shadow-lg transition-all text-white ${
                blog.isPublished
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
              title={blog.isPublished ? "Unpublish" : "Publish"}
            >
              {blog.isPublished ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
            <button
              onClick={handleDelete}
              className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
              title="Delete Blog"
            >
              <Trash2 size={24} />
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/blogs")}
            className="group flex items-center gap-2 text-textMuted hover:text-primary transition-colors mb-8"
          >
            <div className="p-2 rounded-full bg-surface dark:bg-gray-800 group-hover:bg-primary/10 transition-colors border border-border">
              <ArrowLeft size={18} />
            </div>
            <span className="font-medium">Back to Blogs</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary font-semibold mb-4">
              {blog.tags &&
                blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              {blog.publishedAt && (
                <span className="text-textMuted font-normal flex items-center gap-1">
                  <Calendar size={14} />{" "}
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </span>
              )}
              {!blog.isPublished && (
                <span className="text-amber-500 font-bold border border-amber-500 px-2 rounded uppercase text-xs">
                  Draft
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-textMain dark:text-white leading-tight mb-6">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between border-b border-border pb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {blog.author?.picture ? (
                    <img
                      src={blog.author.picture}
                      alt={blog.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    blog.author?.name?.charAt(0) || "Q"
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-textMain dark:text-gray-200">
                    {blog.author?.name || "Qubli Team"}
                  </p>
                  <p className="text-xs text-textMuted flex items-center gap-1">
                    <Clock size={12} /> {blog.readTime}
                  </p>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-surfaceHighlight text-textMuted hover:text-primary transition-colors"
                title="Share"
              >
                <Share2 size={20} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-surface">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12 relative">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <List size={18} /> Table of Contents
              </h3>
              <ul className="space-y-2 text-sm border-l-2 border-border pl-4">
                {toc.map((heading, idx) => (
                  <li key={idx} className={`pl-${(heading.level - 1) * 2}`}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(heading.id)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-textMuted hover:text-primary transition-colors block py-0.5"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-3xl grow mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="prose prose-lg dark:prose-invert max-w-none 
                prose-headings:font-bold prose-headings:text-textMain dark:prose-headings:text-white
                prose-p:text-textMuted prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-textMain dark:prose-strong:text-gray-200
                prose-li:text-textMuted
                prose-img:rounded-xl prose-img:shadow-lg"
            >
              <ReactMarkdown
                components={{
                  h1: ({ _node, ...props }) => (
                    <h1
                      id={props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}
                      {...props}
                    />
                  ),
                  h2: ({ _node, ...props }) => (
                    <h2
                      id={props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}
                      {...props}
                    />
                  ),
                  h3: ({ _node, ...props }) => (
                    <h3
                      id={props.children
                        ?.toString()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}
                      {...props}
                    />
                  ),
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </motion.div>

            {/* Footer Navigation */}
            <div className="mt-16 pt-8 border-t border-border flex justify-between items-center mb-12">
              <h3 className="text-xl font-bold text-textMain dark:text-white">
                Continued Learning
              </h3>
              <button
                onClick={() => navigate("/blogs")}
                className="md:px-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-primary/25"
              >
                Read More Articles
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </article>

      {/* Admin Editor Modal for Editing */}
      {showEditor && (
        <BlogEditor
          blog={blog}
          onClose={() => setShowEditor(false)}
          onSave={async () => {
            const updated = await blogService.getBlogBySlug(id); // Re-fetch
            setBlog(updated);
          }}
        />
      )}
    </>
  );
};

export default BlogPost;
