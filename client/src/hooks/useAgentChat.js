import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import useAuth from "./useAuth";

const buildMessage = (overrides = {}) => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  role: "assistant",
  content: "",
  toolsUsed: [],
  suggestions: [],
  toolActivity: [],
  metrics: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const parseSseBlocks = (rawChunk) =>
  rawChunk
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const line = block
        .split("\n")
        .find((entry) => entry.startsWith("data:"));
      if (!line) {
        return null;
      }

      try {
        return JSON.parse(line.slice(5).trim());
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean);

export default function useAgentChat() {
  const { accessToken, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [health, setHealth] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const currentAssistantIdRef = useRef(null);

  const storageKey = useMemo(
    () => `bugbot_stream_session_${String(user?.userId || user?._id || "guest")}`,
    [user?._id, user?.userId],
  );

  const persistSession = useCallback(
    (nextMessages, nextSessionId) => {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          sessionId: nextSessionId,
          messages: nextMessages,
        }),
      );
    },
    [storageKey],
  );

  const loadSessions = useCallback(async () => {
    const { data } = await api.get("/agent/sessions");
    setSessions(data.items || []);
  }, []);

  const loadHealth = useCallback(async () => {
    const { data } = await api.get("/agent/health");
    setHealth(data);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessionId(parsed.sessionId || "");
      setMessages(parsed.messages || []);
    }
  }, [storageKey]);

  useEffect(() => {
    persistSession(messages, sessionId);
  }, [messages, persistSession, sessionId]);

  useEffect(() => {
    void Promise.allSettled([loadSessions(), loadHealth()]);
  }, [loadSessions, loadHealth]);

  const startNewChat = useCallback(() => {
    setSessionId("");
    setAlerts([]);
    setError("");
    setMessages([]);
    persistSession([], "");
  }, [persistSession]);

  const removeSession = useCallback(
    async (id) => {
      await api.delete(`/agent/sessions/${id}`);
      if (id === sessionId) {
        startNewChat();
      }
      await loadSessions();
    },
    [loadSessions, sessionId, startNewChat],
  );

  const appendAssistantContent = useCallback((assistantId, token) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? { ...message, content: `${message.content}${token}` }
          : message,
      ),
    );
  }, []);

  const updateAssistant = useCallback((assistantId, updater) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId ? updater(message) : message,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    async (rawMessage) => {
      const message = rawMessage.trim();
      if (!message || loading) {
        return;
      }

      setLoading(true);
      setError("");
      const userMessage = buildMessage({
        role: "user",
        content: message,
      });
      const assistantMessage = buildMessage({
        role: "assistant",
      });
      currentAssistantIdRef.current = assistantMessage.id;
      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);
      persistSession(nextMessages, sessionId);

      abortRef.current?.abort?.();
      abortRef.current = new AbortController();

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/agent/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message,
              ...(sessionId ? { sessionId } : {}),
            }),
            signal: abortRef.current.signal,
            credentials: "include",
          },
        );

        if (!response.ok || !response.body) {
          throw new Error("Unable to start streaming response.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          chunks.flatMap(parseSseBlocks).forEach((payload) => {
            const assistantId = currentAssistantIdRef.current;
            if (!assistantId) {
              return;
            }

            if (payload.type === "token") {
              appendAssistantContent(assistantId, payload.content);
            }

            if (payload.type === "tool_start") {
              updateAssistant(assistantId, (currentMessage) => ({
                ...currentMessage,
                toolActivity: [
                  ...(currentMessage.toolActivity || []).filter(
                    (entry) => entry.tool !== payload.tool,
                  ),
                  { tool: payload.tool, status: "running" },
                ],
              }));
            }

            if (payload.type === "tool_end") {
              updateAssistant(assistantId, (currentMessage) => ({
                ...currentMessage,
                toolActivity: [
                  ...(currentMessage.toolActivity || []).filter(
                    (entry) => entry.tool !== payload.tool,
                  ),
                  {
                    tool: payload.tool,
                    status: "done",
                    resultCount: payload.result_count,
                    latencyMs: payload.latencyMs,
                  },
                ],
              }));
            }

            if (payload.type === "suggestions") {
              updateAssistant(assistantId, (currentMessage) => ({
                ...currentMessage,
                suggestions: payload.items || [],
              }));
            }

            if (payload.type === "alert") {
              setAlerts((current) => [
                ...current.filter((entry) => entry.message !== payload.message),
                payload,
              ]);
            }

            if (payload.type === "done") {
              setSessionId(payload.sessionId || "");
              updateAssistant(assistantId, (currentMessage) => ({
                ...currentMessage,
                toolsUsed: payload.toolsUsed || [],
                metrics: {
                  latencyMs: payload.latencyMs || 0,
                  tokensUsed: payload.tokensUsed || 0,
                  cached: payload.cached || false,
                },
              }));
              void Promise.allSettled([loadSessions(), loadHealth()]);
            }

            if (payload.type === "error") {
              setError(payload.message || "Agent request failed.");
            }
          });
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to reach BugBot right now.");
      } finally {
        setLoading(false);
      }
    },
    [
      accessToken,
      appendAssistantContent,
      loadHealth,
      loadSessions,
      loading,
      messages,
      persistSession,
      sessionId,
      updateAssistant,
    ],
  );

  return {
    messages,
    alerts,
    sessions,
    health,
    sessionId,
    loading,
    error,
    sendMessage,
    startNewChat,
    removeSession,
    loadSessions,
    loadHealth,
  };
}
