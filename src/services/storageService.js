const API_URL = `http://localhost:${import.meta.env.VITE_SERVER_PORT}/api`;

/** Generic request helper with auto user storage */
async function request(endpoint, method = "GET", body) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Request failed");
  }

  const data = await res.json();

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
}

/** Generic decrement function */
async function decrementLimit(type) {
  const data = await request(`/limits/decrement/${type}`, "POST");
  return data.success;
}

const StorageService = {
  // --- AUTH ---
  register: async (name, email, password) => {
    const data = await request("/auth/register", "POST", {
      name,
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  },

  login: async (email, password) => {
    const data = await request("/auth/login", "POST", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  refreshUser: async () => {
    return await request("/users/me");
  },

  // --- QUIZZES ---
  getQuizzes: async (userId) => {
    try {
      const data = await request("/quizzes");

      // Ensure an array
      let quizzes = [];
      if (Array.isArray(data)) quizzes = data;
      else if (data?.quizzes && Array.isArray(data.quizzes))
        quizzes = data.quizzes;
      else if (data) quizzes = [data]; // fallback if single object returned

      if (!userId) return quizzes;
      return quizzes.filter((q) => q.userId === userId);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
      return [];
    }
  },

  saveQuiz: async (quiz) => {
    if (quiz._id) return request(`/quizzes/${quiz._id}`, "PUT", quiz);
    return request("/quizzes", "POST", quiz);
  },

  deleteQuiz: async (quizId) => request(`/quizzes/${quizId}`, "DELETE"),

  // --- FLASHCARDS ---
  getFlashcards: async (userId) => {
    const data = await request("/flashcards");
    if (!userId) return data;
    return data.filter((c) => c.userId === userId);
  },

  saveFlashcards: async (cards) => request("/flashcards/bulk", "POST", cards),

  updateFlashcard: async (card) =>
    request(`/flashcards/${card.id}`, "PUT", card),

  // --- TIERS & LIMITS ---
  upgradeTier: async (tier) => {
    const data = await request("/subscription/upgrade", "POST", { tier });
    return data.user || data;
  },

  decrementFlashcardGeneration: async () => decrementLimit("flashcard"),
  decrementPdfUpload: async () => decrementLimit("pdfupload"),
  decrementPdfExport: async () => decrementLimit("pdfexport"),

  // --- AI REVIEWS ---
  getLastReview: async () => {
    try {
      const data = await request("/reviews/last");
      return data.review || null;
    } catch (err) {
      console.error("No previous AI review found.");
      return null;
    }
  },

  saveReview: async (reviewText) => {
    const payload = {
      text: reviewText,
      createdAt: Date.now(),
    };
    return request("/reviews", "POST", payload);
  },
};

export default StorageService;
