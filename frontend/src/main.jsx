import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SuperAdminProvider } from "./context/SuperAdminContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SuperAdminProvider>
          <App />
        </SuperAdminProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Service worker : nécessaire pour recevoir les notifications sur l'appareil
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
