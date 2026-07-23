import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "14px",
            fontFamily: "Inter, sans-serif",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);