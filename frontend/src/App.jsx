import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Guide from "./pages/Guide.jsx";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/guide/:id" element={<Guide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
