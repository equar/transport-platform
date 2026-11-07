import React from "react";
import ReactDOM from "react-dom/client";


const application = import.meta.env.VITE_SITE_KIND === "admin"
  ? import("./app/App")
  : import("./app/PublicApp");

application.then(({ App }) => ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
));
