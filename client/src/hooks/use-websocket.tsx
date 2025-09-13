import { useEffect, useRef, useState } from "react";
import { WebSocketClient } from "@/lib/websocket";
import { useAuth } from "./use-auth";

export function useWebSocket() {
  const { firebaseUser } = useAuth();
  const wsRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (firebaseUser?.email) {
      wsRef.current = new WebSocketClient(firebaseUser.email);
      setIsConnected(true);

      return () => {
        wsRef.current?.disconnect();
        setIsConnected(false);
      };
    }
  }, [firebaseUser?.email]);

  const sendMessage = (data: any) => {
    wsRef.current?.sendMessage(data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    wsRef.current?.on(event, callback);
  };

  const off = (event: string, callback: (data: any) => void) => {
    wsRef.current?.off(event, callback);
  };

  return {
    sendMessage,
    on,
    off,
    isConnected,
  };
}
