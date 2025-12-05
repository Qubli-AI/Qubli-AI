const API_URL = `http://localhost:${import.meta.env.VITE_SERVER_PORT}`;

export async function request(endpoint, method = "GET", body) {
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

  const text = await res.text(); // Get raw response

  // Detect HTML error pages
  if (text.startsWith("<") || text.startsWith("<!DOCTYPE")) {
    console.error("❌ Server returned HTML:", text);
    throw new Error("Server error: invalid JSON response.");
  }

  // Parse JSON safely
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("❌ JSON Parse Error:", err, text);
    throw new Error("Server returned invalid JSON.");
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function login(email, password) {
  return request("/api/auth/login", "POST", { email, password });
}

export function register(name, email, password) {
  return request("/api/auth/register", "POST", { name, email, password });
}
