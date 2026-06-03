import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function NotificationBadge() {

  const [count, setCount] =
    useState(0);

  const navigate =
    useNavigate();

  const loadCount =
    async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await api.get(
          "/notifications/unread-count",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setCount(
        response.data.count
      );

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    loadCount();

    const interval =
      setInterval(
        loadCount,
        10000
      );

    return () =>
      clearInterval(interval);

  }, []);

  return (

    <button
      className="
        btn
        btn-warning
        me-2
      "
      onClick={() =>
        navigate(
          "/notifications"
        )
      }
    >

      🔔

      {" "}

      {count}

    </button>

  );

}
