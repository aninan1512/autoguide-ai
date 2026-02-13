// frontend/src/api/client.js
import axios from "axios";

const api = axios.create({
  // In production (Vercel), set VITE_API_BASE_URL to your Render URL:
  // e.g. https://autoguide-ai.onrender.com
  //
  // In local dev, leave VITE_API_BASE_URL empty and Vite proxy will handle /api -> backend
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
