import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function NotificationBadge() {

  const [count, setCount] = useState(0);

  const navigate = useNavigate();

  const loadCount = async () => {

    const token = localStorage.getItem(
      "token"
    );

    if (!token) {

      setCount(0);

      return;

    }

    try {

      const response = await api.get(
        "/notifications/unread-count",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      setCount(
        response.data.count || 0
      );

    } catch (error) {

      console.log(
        "Notification count error:",
        error
      );

      setCount(0);

    }

  };

  useEffect(() => {

    loadCount();

    const interval = setInterval(
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
        position-relative
      "
      onClick={() =>
        navigate(
          "/notifications"
        )
      }
    >

      🔔 Notifications

      {

        count > 0 && (

          <span
            className="
              position-absolute
              top-0
              start-100
              translate-middle
              badge
              rounded-pill
              bg-danger
            "
          >

            {count}

          </span>

        )

      }

    </button>

  );

}
