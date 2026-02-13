import axios from "axios";

const api = axios.create({
  baseURL: "", // uses Vite proxy in local dev
  withCredentials: false,
});

export default api;
