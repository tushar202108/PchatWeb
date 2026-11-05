import { Client } from "@stomp/stompjs";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { apiConfig } from "../config/apiConfig"; // Update path to your apiConfig file

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnected: boolean = false;
  private onDisconnectedCallback?: () => void;

  public connect(
    token: string,
    onConnectedCallback?: () => void,
    onDisconnectedCallback?: () => void,
  ): void {
    this.onDisconnectedCallback = onDisconnectedCallback;
    if (this.client && this.isConnected) return;

    const wsUrl = `${apiConfig.wsURL}`;
    console.log("Connecting to WebSocket broker at:", token);

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log("[STOMP Debug]:", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        console.log("Connected to WebSocket broker");
        if (onConnectedCallback) onConnectedCallback();
      },
      onDisconnect: () => {
        this.isConnected = false;
        console.log("Disconnected from WebSocket broker");
        this.onDisconnectedCallback?.();
      },
      onWebSocketClose: () => {
        this.isConnected = false;
        this.onDisconnectedCallback?.();
      },
      onStompError: (frame) => {
        console.error("Broker error:", frame.headers["message"], frame.body);
      },
    });

    this.client.activate();
  }

  public subscribe(
    destination: string,
    callback: (message: IMessage) => void,
  ): void {
    if (!this.client || !this.isConnected) {
      console.warn("Cannot subscribe, WebSocket is not connected.");
      return;
    }

    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
  }

  public unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  public publish(destination: string, payload: unknown): void {
    if (!this.client || !this.isConnected) {
      console.error("Cannot publish message, WebSocket is not connected.");
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(payload),
    });
  }

  public disconnect(): void {
    if (this.client) {
      for (const subscription of this.subscriptions.values()) {
        subscription.unsubscribe();
      }
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.onDisconnectedCallback?.();
    }
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
