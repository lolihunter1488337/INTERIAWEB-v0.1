import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("APP ERROR:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, fontFamily: "monospace", color: "#fff", background: "#0a0a0a", minHeight: "100vh" }}>
          <h2 style={{ color: "#ff5555" }}>Ошибка рендера:</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err && this.state.err.stack || this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (e) => {
  const r = document.getElementById("root");
  if (r && !r.firstChild) r.innerHTML = "<pre style='color:#ff5555;padding:24px;white-space:pre-wrap'>" + (e.message || e.error) + "\n" + (e.error && e.error.stack || "") + "</pre>";
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary><App /></ErrorBoundary>
);

// PWA: регистрируем service worker (для установки приложения на телефон/ПК)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
