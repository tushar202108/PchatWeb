
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import AppRouter from "./app/router";
import { AuthProvider } from "./context/authContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import "./index.css";
import { ThemeProvider } from "./theme/themeContext";
import GlobalBroadcastListener from "./context/GlobalBroadcastListener";

ReactDOM.createRoot(document.getElementById("root")!).render(
 <React.StrictMode>
  <ThemeProvider>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "var(--primary)",
          borderRadius: 8,
          fontFamily: "Arial, sans-serif",
        },
      }}
    >
      <HashRouter>
        <AuthProvider>
          <WebSocketProvider>
             <GlobalBroadcastListener/>
            <AppRouter />
          </WebSocketProvider>
        </AuthProvider>
      </HashRouter>
    </ConfigProvider>
  </ThemeProvider>
</React.StrictMode>
);
