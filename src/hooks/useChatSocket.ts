
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
  existingOnlineUser?: (status: any) => void;
  userAcknowledge?: (status: any) => void;
}

export const useChatSocket = ({
  connected,
  localDataLoaded,
  subscribe,
  onIncomingMessage,
  onUserStatus,existingOnlineUser,userAcknowledge
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
      "/topic/presence",
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


useEffect(() => {
    if (!connected || !localDataLoaded) return;

    const unsubscribe = subscribe(
      "/user/queue/presence",
      (message) => {
        try {
          const status = JSON.parse(message.body);
          existingOnlineUser?.(status);
        } catch (error) {
          console.error("User status error:", error);
        }
      }
    );

    return unsubscribe;
  }, [connected, localDataLoaded, subscribe, existingOnlineUser]);
useEffect(() => {
    if (!connected || !localDataLoaded) return;

    const unsubscribe = subscribe(
      "/app/messages.ack",
      (message) => {
        try {
          const members = JSON.parse(message.body);
          userAcknowledge?.(members);
        } catch (error) {
          console.error("User status error:", error);
        }
      }
    );

    return unsubscribe;
  }, [connected, localDataLoaded, subscribe, existingOnlineUser]);

  
};
