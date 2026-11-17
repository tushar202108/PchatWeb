
const BACKEND_HOST = "10.229.40.83";
const BACKEND_PORT = 8080;

const WS_PROTOCOL =
  window.location.protocol === "https:" ? "wss:" : "ws:";

const WS_ORIGIN = `${WS_PROTOCOL}//${BACKEND_HOST}:${BACKEND_PORT}`;
const HTTP_ORIGIN = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

export const apiConfig = {
  httpOrigin: HTTP_ORIGIN,
  baseURL: `${HTTP_ORIGIN}/api`,
  wsURL: `${WS_ORIGIN}/ws`,
  timeout: 15000,
};
