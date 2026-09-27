import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const payload = parseJwt(token);
  if (!payload || payload.role !== "ADMIN") {
    toast.error("Access denied: Administrator privileges required.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
