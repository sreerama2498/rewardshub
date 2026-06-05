import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ExpiryDashboard from "../components/ExpiryDashboard";

export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        const token = localStorage.getItem("token");

        const userResponse = await api.get(
          "/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setUser(userResponse.data);

        try {

          const statsResponse = await api.get(
            "/stats",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setStats(statsResponse.data);

        } catch (error) {

          console.log("Stats API not available");

        }

        try {

          const activityResponse = await api.get(
            "/activity",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          setActivities(
            activityResponse.data
          );

        } catch (error) {

          console.log("Activity API not available");

        }

      } catch (error) {

        console.log(error);

        localStorage.removeItem("token");

        navigate("/");

      }

    };

    loadDashboard();

  }, []);

  if (!user) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="container mt-4">

      <Navbar />

      <h1 className="mb-4">
        RewardsHub Dashboard
      </h1>

      <div className="card mb-4">
        <div className="card-body">

          <h3>
            Welcome {user.name}
          </h3>

          <p>
            <strong>Email:</strong>{" "}
            {user.email}
          </p>

          <p>
            <strong>User ID:</strong>{" "}
            {user.id}
          </p>

        </div>
      </div>

      <h2 className="mb-3">
        Statistics
      </h2>

      <div className="row mb-4">

        {/* ✅ Total Users - clickable */}
        <div className="col-md-3 mb-3">

          <div
            className="card text-center shadow-sm"
            style={{
              cursor: "pointer"
            }}
            onClick={() => {
              alert("Users clicked");
            }}
          >

            <div className="card-body">

              <h5>Total Users</h5>

              <h2>
                {stats?.total_users || 0}
              </h2>

            </div>

          </div>

        </div>

        <div className="col-md-3 mb-3">

          <div className="card text-center shadow-sm">

            <div className="card-body">

              <h5>Coupons</h5>

              <h2>
                {stats?.total_coupons || 0}
              </h2>

            </div>

          </div>

        </div>

        <div className="col-md-3 mb-3">

          <div className="card text-center shadow-sm">

            <div className="card-body">

              <h5>Shares</h5>

              <h2>
                {stats?.total_shares || 0}
              </h2>

            </div>

          </div>

        </div>

        <div className="col-md-3 mb-3">

          <div className="card text-center shadow-sm">

            <div className="card-body">

              <h5>Accepted</h5>

              <h2>
                {stats?.accepted_shares || 0}
              </h2>

            </div>

          </div>

        </div>

      </div>

      <ExpiryDashboard />

      <h2 className="mb-3">
        Recent Activity
      </h2>

      {
        activities.length === 0 ? (

          <div className="alert alert-info">
            No activity available.
          </div>

        ) : (

          activities.map(
            (
              activity,
              index
            ) => (

              <div
                key={index}
                className="card mb-3 shadow-sm"
              >

                <div className="card-body">

                  <h5>
                    {activity.type}
                  </h5>

                  <p>
                    {activity.title}
                  </p>

                  <small
                    className="text-muted"
                  >
                    {
                      activity.created_at
                        ? new Date(
                            activity.created_at
                          ).toLocaleString()
                        : "No Timestamp"
                    }
                  </small>

                </div>

              </div>

            )
          )

        )
      }

      <h2 className="mt-4 mb-3">
        Quick Actions
      </h2>

      <div className="d-flex gap-2 flex-wrap">

        <button
          className="btn btn-primary"
          onClick={() =>
            navigate("/my-coupons")
          }
        >
          My Coupons
        </button>

        <button
          className="btn btn-success"
          onClick={() =>
            navigate("/shared-with-me")
          }
        >
          Shared Coupons
        </button>

        <button
          className="btn btn-warning"
          onClick={() =>
            navigate("/users")
          }
        >
          Users
        </button>

        <button
          className="btn btn-secondary"
          onClick={() =>
            navigate("/profile")
          }
        >
          Profile
        </button>

      </div>

    </div>
  );
}
