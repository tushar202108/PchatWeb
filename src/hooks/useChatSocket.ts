
import { useEffect, useRef } from "react";

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
  onUserStatus,
  existingOnlineUser,
  userAcknowledge,
}: UseChatSocketProps) => {

  // Keep the latest callbacks without restarting subscriptions.
  const callbacksRef = useRef({
    onIncomingMessage,
    onUserStatus,
    existingOnlineUser,
    userAcknowledge,
  });

  callbacksRef.current = {
    onIncomingMessage,
    onUserStatus,
    existingOnlineUser,
    userAcknowledge,
  };

  useEffect(() => {
    if (!connected || !localDataLoaded) return;

    console.log("Subscribing to chat WebSocket destinations...");

    // 1. Incoming private messages
    const unsubscribeMessages = subscribe(
      "/user/queue/messages",
      (message) => {
        try {
          const received = JSON.parse(message.body);
          callbacksRef.current.onIncomingMessage?.(received);
        } catch (error) {
          console.error("Incoming message error:", error);
        }
      }
    );

    // 2. Online/offline status
    const unsubscribeTopicPresence = subscribe(
      "/topic/presence",
      (message) => {
        try {
          const status = JSON.parse(message.body);
          callbacksRef.current.onUserStatus?.(status);
        } catch (error) {
          console.error("User status error:", error);
        }
      }
    );

    // 3. Existing online users
    const unsubscribeUserPresence = subscribe(
      "/user/queue/presence",
      (message) => {
        try {
          const status = JSON.parse(message.body);
          callbacksRef.current.existingOnlineUser?.(status);
        } catch (error) {
          console.error("Existing online users error:", error);
        }
      }
    );

    // 4. Message acknowledgements
    const unsubscribeAcknowledgements = subscribe(
      "/user/queue/message-ack",
      (message) => {
        try {
          const acknowledgement = JSON.parse(message.body);
          callbacksRef.current.userAcknowledge?.(acknowledgement);
        } catch (error) {
          console.error("Message acknowledgement error:", error);
        }
      }
    );

    return () => {
      console.log("Unsubscribing from chat WebSocket destinations...");

      unsubscribeMessages?.();
      unsubscribeTopicPresence?.();
      unsubscribeUserPresence?.();
      unsubscribeAcknowledgements?.();
    };

  }, [connected, localDataLoaded, subscribe]);
};
