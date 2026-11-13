
import { useEffect } from "react";

interface UseChatSocketProps {
  connected: boolean;
  localDataLoaded: boolean;
  subscribe: (
    destination: string,
    callback: (message: { body: string }) => void
  ) => () => void;
  onIncomingMessage?: (message: any) => void;
  onUserStatus?: (status: any) => void;
}

export const useChatSocket = ({
  connected,
  localDataLoaded,
  subscribe,
  onIncomingMessage,
  onUserStatus,
}: UseChatSocketProps) => {

  // Incoming private messages
  useEffect(() => {
    if (!connected || !localDataLoaded) return;

    const unsubscribe = subscribe(
      "/user/queue/messages",
      (message) => {
        try {
          const received = JSON.parse(message.body);
          onIncomingMessage?.(received);
        } catch (error) {
          console.error("Incoming message error:", error);
        }
      }
    );

    return unsubscribe;
  }, [connected, localDataLoaded, subscribe, onIncomingMessage]);


  // User online/offline status
  useEffect(() => {
    if (!connected || !localDataLoaded) return;

    const unsubscribe = subscribe(
      "/user/topic/presence",
      (message) => {
        try {
          const status = JSON.parse(message.body);
          onUserStatus?.(status);
        } catch (error) {
          console.error("User status error:", error);
        }
      }
    );

    return unsubscribe;
  }, [connected, localDataLoaded, subscribe, onUserStatus]);

};
