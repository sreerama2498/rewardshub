import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function Users() {

  const [users, setUsers] = useState([]);

  useEffect(() => {

    const loadUsers = async () => {

      try {

        const token = localStorage.getItem("token");

        const response = await api.get(
          "/users",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setUsers(response.data);

      } catch (error) {

        console.log(error);

      }

    };

    loadUsers();

  }, []);

  return (
    <div style={{ padding: "40px" }}>

      <Navbar />

      <h1>Registered Users</h1>

      <hr />

      {
        users.map((user) => (

          <div
            key={user.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "8px"
            }}
          >

            <h3>{user.name}</h3>

            <p>{user.email}</p>

            <p>User ID: {user.id}</p>

          </div>

        ))
      }

    </div>
  );
}
