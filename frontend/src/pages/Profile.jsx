import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

import { toast } from "react-toastify";

export default function Profile() {

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [createdAt, setCreatedAt] =
    useState("");

  const [currentPassword,
    setCurrentPassword] =
      useState("");

  const [newPassword,
    setNewPassword] =
      useState("");

  useEffect(() => {

    loadProfile();

  }, []);

  const loadProfile = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.get(
          "/profile",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setName(
        response.data.name
      );

      setEmail(
        response.data.email
      );

      setCreatedAt(
        response.data.created_at
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Profile"
      );

    } finally {

      setLoading(false);

    }

  };

  const updateProfile =
    async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.put(
          "/profile",
          {
            name,
            email
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      toast.success(
        response.data.message
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Profile Update Failed"
      );

    }

  };

  const changePassword =
    async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await api.put(
          "/change-password",
          {
            current_password:
              currentPassword,

            new_password:
              newPassword
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      toast.success(
        response.data.message
      );

      setCurrentPassword("");
      setNewPassword("");

    } catch (error) {

      console.log(error);

      toast.error(
        "Password Change Failed"
      );

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  return (

    <div className="container mt-4">

      <Navbar />

      <div className="card p-4 mb-4">

        <h2>
          Profile Information
        </h2>

        <input
          className="form-control mb-2"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <input
          className="form-control mb-3"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-primary"
          onClick={updateProfile}
        >
          Update Profile
        </button>

      </div>

      <div className="card p-4 mb-4">

        <h2>
          Change Password
        </h2>

        <input
          type="password"
          className="form-control mb-2"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) =>
            setCurrentPassword(
              e.target.value
            )
          }
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) =>
            setNewPassword(
              e.target.value
            )
          }
        />

        <button
          className="btn btn-warning"
          onClick={changePassword}
        >
          Change Password
        </button>

      </div>

      <div className="card p-4">

        <h2>
          Account Details
        </h2>

        <p>

          <strong>
            Account Created:
          </strong>

          {" "}

          {
            createdAt
              ? new Date(
                  createdAt
                ).toLocaleString()
              : "N/A"
          }

        </p>

      </div>

    </div>

  );

}
