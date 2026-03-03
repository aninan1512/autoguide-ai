import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", { name, email, password });

      // If backend returns token on register:
      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        window.location.href = "/dashboard";
      } else {
        // Otherwise go login
        window.location.href = "/login";
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold">Sign up</h1>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <input
          className="mt-4 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

        <input
          className="mt-3 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
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
          autoComplete="new-password"
        />

        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="mt-4 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link className="text-white underline font-semibold" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}