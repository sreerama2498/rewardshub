import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({

  baseURL: "/api"

});

api.interceptors.request.use(

  (config) => {

    const token = localStorage.getItem("token");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  }

);

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      // Do not redirect or wipe session if the 401 was from an explicit login attempt
      if (error.config?.url?.includes("/login")) {
        return Promise.reject(error);
      }

      localStorage.removeItem("token");

      toast.error(
        "Session expired. Please login again."
      );

      window.location.href = "/";

    }

    return Promise.reject(error);

  }

);

export default api;
