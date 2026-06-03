import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";

import {
  ToastContainer
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import "./index.css";

import App from "./App.jsx";

createRoot(
  document.getElementById("root")
).render(

  <StrictMode>

    <App />

    <ToastContainer
      position="top-right"
      autoClose={3000}
      theme="colored"
    />

  </StrictMode>

);
