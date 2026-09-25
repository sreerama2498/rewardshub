import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationBadge from "./NotificationBadge";

import api from "../services/api";

export default function Navbar() {

  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let roleFound = false;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role) {
          setUserRole(payload.role);
          roleFound = true;
        }
      }
    } catch (e) {
      console.error("Token decode error:", e);
    }

    // Also fetch /me to always sync the latest role from DB
    api.get("/me")
      .then((res) => {
        if (res.data?.role) {
          setUserRole(res.data.role);
        }
      })
      .catch(() => {});
  }, []);

  return (

    <nav
      className="
        navbar
        navbar-expand-lg
        navbar-dark
        bg-dark
        mb-4
        px-3
      "
    >

      <span className="navbar-brand">
        RewardsHub
      </span>

      <div>

        <button
          className="btn btn-outline-light me-2"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Home
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/my-coupons")
          }
        >
          Coupons
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/marketplace")
          }
        >
          Marketplace
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/shared-with-me")
          }
        >
          Shares
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/sent-shares")
          }
        >
          Sent Shares
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/users")
          }
        >
          Users
        </button>

        <button
          className="btn btn-outline-light me-2"
          onClick={() =>
            navigate("/profile")
          }
        >
          Profile
        </button>

        {userRole === "ADMIN" && (
          <button
            className="btn btn-warning me-2"
            onClick={() =>
              navigate("/admin")
            }
          >
            Admin
          </button>
        )}

        <NotificationBadge />

        <button
          className="btn btn-danger"
          onClick={() => {

            localStorage.removeItem(
              "token"
            );

            navigate("/");

          }}
        >
          Logout
        </button>

      </div>

    </nav>

  );

}
