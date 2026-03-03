import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      const token = res.data?.token;

      if (!token) throw new Error("No token returned from server.");
      localStorage.setItem("token", token);

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold">Sign in</h1>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <input
          className="mt-4 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          className="mt-3 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-sm text-zinc-400">
          Don’t have an account?{" "}
          <Link className="text-white underline font-semibold" to="/register">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}