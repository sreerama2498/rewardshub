import { useNavigate } from "react-router-dom";
import NotificationBadge from "./NotificationBadge";

export default function Navbar() {

  const navigate = useNavigate();

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

        <button
          className="btn btn-warning me-2"
          onClick={() =>
            navigate("/admin")
          }
        >
          Admin
        </button>

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
