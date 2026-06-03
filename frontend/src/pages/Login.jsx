import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {

    try {

      const response = await api.post(
        "/login",
        {
          email,
          password
        }
      );
      console.log("LOGIN RESPONSE:");
      console.log(response.data);
      localStorage.setItem(
        "token",
        response.data.access_token
      );

      toast.success(
        "Login Successful"
      );

      navigate("/dashboard");

    } catch (error) {

      console.log(error);

      toast.error(
        "Invalid Email or Password"
      );

    }

  };

  return (

    <div className="container mt-5">

      <div className="card p-4">

        <h1>RewardsHub Login</h1>

        <input
          className="form-control mt-3"
          type="email"
          placeholder="Email"
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          className="form-control mt-3"
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="btn btn-primary mt-3"
          onClick={login}
        >
          Login
        </button>

        <button
          className="btn btn-secondary mt-3"
          onClick={() =>
            navigate("/register")
          }
        >
          Create Account
        </button>

      </div>

    </div>

  );

}
