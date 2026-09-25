import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const register = async () => {

    try {

      await api.post(
        "/register",
        {
          name,
          email,
          password
        }
      );

      toast.success("Registration Successful");

      navigate("/");

    } catch (error) {

      console.log(error);

      const msg = error.response?.data?.detail || "Registration Failed";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));

    }

  };

  return (
    <div style={{ padding: "40px" }}>

      <h1>RewardsHub Register</h1>

      <input
        placeholder="Name"
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br /><br />

      <input
        type="email"
        placeholder="Email"
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <br /><br />

      <button onClick={register}>
        Register
      </button>

      <br /><br />

      <button
        onClick={() => navigate("/")}
      >
        Back To Login
      </button>

    </div>
  );
}
