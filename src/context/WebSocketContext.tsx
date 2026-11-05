import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { IMessage } from "@stomp/stompjs";
import { tokenStore } from "../Axios/axiosService";
import { webSocketService } from "../Axios/webSocketService";
import { useAuth } from "./authContext";

interface WebSocketContextValue {
  connected: boolean;
  subscribe: (
    destination: string,
    callback: (message: IMessage) => void,
  ) => () => void;
  publish: (destination: string, payload: unknown) => void;
  unsubscribe: (destination: string) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined,
);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { hasSession } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = hasSession ? tokenStore.get() : null;

    if (!token) {
      webSocketService.disconnect();
      return;
    }

    console.log("Connecting to WebSocket broker with token:", token);

    webSocketService.connect(
      token,
      () => setConnected(true),
      () => setConnected(false),
    );

    return () => webSocketService.disconnect();
  }, [hasSession]);

  const subscribe: WebSocketContextValue["subscribe"] = (
    destination,
    callback,
  ) => {
    webSocketService.subscribe(destination, callback);
    return () => webSocketService.unsubscribe(destination);
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        subscribe,
        publish: (destination, payload) =>
          webSocketService.publish(destination, payload),
        unsubscribe: (destination) => webSocketService.unsubscribe(destination),
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  }

  return context;
}
