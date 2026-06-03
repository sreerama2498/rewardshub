import { useEffect, useState } from "react";

import api from "../services/api";

import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

import { toast } from "react-toastify";

export default function Notifications() {

  const [loading, setLoading] =
    useState(true);

  const [notifications,
    setNotifications] =
      useState([]);

  useEffect(() => {

    loadNotifications();

  }, []);

  const loadNotifications =
    async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await api.get(
          "/notifications",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setNotifications(
        response.data
      );

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Notifications"
      );

    } finally {

      setLoading(false);

    }

  };

  const markRead =
    async (id) => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      await api.put(
        `/notifications/read/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      toast.success(
        "Marked As Read"
      );

      loadNotifications();

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Update"
      );

    }

  };

  if (loading) {

    return <LoadingSpinner />;

  }

  return (

    <div className="container mt-4">

      <Navbar />

      <h1>
        Notifications
      </h1>

      <hr />

      <button
        className="
          btn
          btn-primary
          mb-3
        "
        onClick={
          loadNotifications
        }
      >
        Refresh
      </button>

      {
        notifications.length === 0

        ? (

            <div
              className="
                alert
                alert-info
              "
            >
              No Notifications
            </div>

          )

        : (

            notifications.map(
              (
                notification
              ) => (

                <div
                  key={
                    notification.id
                  }
                  className={`
                    card
                    mb-3
                    ${
                      notification.is_read
                        ? ""
                        : "border-warning"
                    }
                  `}
                >

                  <div
                    className="
                      card-body
                    "
                  >

                    <h5>
                      {
                        notification.title
                      }
                    </h5>

                    <p>
                      {
                        notification.message
                      }
                    </p>

                    <small
                      className="
                        text-muted
                      "
                    >
                      {
                        notification.created_at
                          ? new Date(
                              notification.created_at
                            ).toLocaleString()
                          : ""
                      }
                    </small>

                    <br />

                    {
                      !notification.is_read && (

                        <button
                          className="
                            btn
                            btn-success
                            mt-2
                          "
                          onClick={() =>
                            markRead(
                              notification.id
                            )
                          }
                        >
                          Mark Read
                        </button>

                      )
                    }

                  </div>

                </div>

              )
            )

          )
      }

    </div>

  );

}
