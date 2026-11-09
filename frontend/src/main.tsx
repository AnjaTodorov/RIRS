import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./app.css";

const confirmation = new URLSearchParams(window.location.hash.slice(1));
if (confirmation.get("type") === "signup" || confirmation.has("error")) {
  window.history.replaceState(null, "", "/registracija" + window.location.hash);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
