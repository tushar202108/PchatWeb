
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ConfigProvider } from "antd";

import AppRouter from "./app/router";
import { AuthProvider } from "./context/authContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily: "Arial, sans-serif",
        },
      }}
    >
      <HashRouter>
        <AuthProvider>
          <WebSocketProvider>
            <AppRouter />
          </WebSocketProvider>
        </AuthProvider>
      </HashRouter>
    </ConfigProvider>
  </React.StrictMode>,
);
