import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { worker } from "./api";

worker.start();

ReactDOM.render(
  <React.StrictMode>
    <div style={{ padding: "16px" }}>
      <App />
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);
