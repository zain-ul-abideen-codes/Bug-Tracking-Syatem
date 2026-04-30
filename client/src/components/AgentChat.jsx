import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AutoAwesomeRounded,
  CheckCircleRounded,
  MicOutlined,
  RefreshRounded,
  SearchRounded,
  SendRounded,
  SmartToyRounded,
} from "@mui/icons-material";
import useAgentChat from "../hooks/useAgentChat";
import BugBotRenderer from "./BugBotRenderer";
import useAuth from "../hooks/useAuth";

const rolePrompts = {
  administrator: [
    "Show my projects",
    "Show dashboard stats",
    "Show open bugs",
  ],
  manager: [
    "Show my projects and bugs",
    "Which project has most bugs?",
    "Show unassigned bugs",
  ],
  qa: [
    "Show my bugs",
    "Find bugs login error",
    "Show dashboard stats",
  ],
  developer: [
    "Show my bugs",
    "What's my workload today?",
    "Show started issues",
  ],
};

export default function AgentChat({ chat }) {
  const { user } = useAuth();
  const agentChat = chat || useAgentChat();
  const {
    messages,
    alerts,
    sessionId,
    loading,
    error,
    sendMessage,
    startNewChat,
  } = agentChat;
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = useMemo(
    () => rolePrompts[user?.role] || rolePrompts.developer,
    [user?.role],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentDraft = draft;
    setDraft("");
    await sendMessage(currentDraft);
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!draft.trim() || loading) {
        return;
      }
      const currentDraft = draft;
      setDraft("");
      await sendMessage(currentDraft);
    }
  };

  const handleVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      setDraft(event.results[0][0].transcript);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
  };

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          color: "white",
          background:
            "linear-gradient(135deg, rgba(25,118,210,0.98), rgba(66,165,245,0.95) 55%, rgba(156,39,176,0.88))",
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Box>
              <Typography sx={{ letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.85 }}>
                AI Agent
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>
                BugBot Streaming Workspace
              </Typography>
              <Typography sx={{ mt: 1.25, maxWidth: 860, opacity: 0.9 }}>
                Real-time answers, tool-aware updates, proactive alerts, and role-safe actions for your bug tracking workflow.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RefreshRounded />}
              onClick={startNewChat}
            >
              New Chat
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip icon={<AutoAwesomeRounded />} label={`${user?.role} scope`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white" }} />
            <Chip icon={<SearchRounded />} label="Streaming responses" sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white" }} />
            <Chip icon={<SmartToyRounded />} label="Fast intent + cache" sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "white" }} />
          </Stack>
        </Stack>
      </Paper>

      {alerts.length > 0 && (
        <Stack spacing={1.25}>
          {alerts.map((alert) => (
            <Alert
              key={alert.message}
              severity={alert.severity || "warning"}
              onClose={() => {}}
            >
              {alert.message}
            </Alert>
          ))}
        </Stack>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6">Quick Prompts</Typography>
        <Typography color="text.secondary" sx={{ mb: 1.5 }}>
          Role-based prompt starters you can click and send.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {suggestions.map((prompt) => (
            <Chip key={prompt} label={prompt} onClick={() => setDraft(prompt)} />
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 2.5, bgcolor: "rgba(25,118,210,0.05)", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <SmartToyRounded />
            </Avatar>
            <Box>
              <Typography variant="h6">Live Conversation</Typography>
              <Typography variant="body2" color="text.secondary">
                Session: {sessionId || "A new session will be created on your first message."}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack sx={{ p: 2.5, minHeight: 500, maxHeight: 640, overflowY: "auto" }} spacing={2}>
          {messages.length === 0 && (
            <Paper
              variant="outlined"
              sx={{ p: 3, borderStyle: "dashed", textAlign: "center" }}
            >
              <Typography variant="h6">Start chatting with BugBot</Typography>
              <Typography color="text.secondary">
                Ask about bugs, projects, dashboards, or use voice input to fill the prompt.
              </Typography>
            </Paper>
          )}

          {messages.map((message) => {
            const isAssistant = message.role === "assistant";
            return (
              <Stack
                key={message.id}
                direction="row"
                spacing={1.25}
                justifyContent={isAssistant ? "flex-start" : "flex-end"}
              >
                {isAssistant && (
                  <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
                    <SmartToyRounded fontSize="small" />
                  </Avatar>
                )}
                <Tooltip
                  title={
                    message.metrics
                      ? `Response time: ${(message.metrics.latencyMs / 1000).toFixed(1)}s | Tokens: ${message.metrics.tokensUsed || 0} | Tools: ${(message.toolsUsed || []).join(", ") || "none"}`
                      : ""
                  }
                >
                  <Paper
                    sx={{
                      px: 2,
                      py: 1.5,
                      maxWidth: "min(100%, 760px)",
                      bgcolor: isAssistant ? "background.paper" : "primary.main",
                      color: isAssistant ? "text.primary" : "white",
                      borderRadius: isAssistant ? "18px 18px 18px 6px" : "18px 18px 6px 18px",
                    }}
                  >
                    {isAssistant ? (
                      <BugBotRenderer content={message.content || ""} />
                    ) : (
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                    )}

                    {Array.isArray(message.toolActivity) && message.toolActivity.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                        {message.toolActivity.map((item) => (
                          <Chip
                            key={`${item.tool}-${item.status}`}
                            size="small"
                            color={item.status === "done" ? "success" : "default"}
                            icon={
                              item.status === "done" ? (
                                <CheckCircleRounded fontSize="small" />
                              ) : (
                                <CircularProgress size={12} />
                              )
                            }
                            label={
                              item.status === "done"
                                ? `${item.tool} (${item.resultCount || 0})`
                                : `${item.tool}...`
                            }
                          />
                        ))}
                      </Stack>
                    )}

                    {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                        {message.suggestions.map((suggestion) => (
                          <Chip
                            key={suggestion}
                            label={suggestion}
                            variant="outlined"
                            size="small"
                            clickable
                            onClick={() => {
                              setDraft(suggestion);
                              void sendMessage(suggestion);
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Tooltip>
              </Stack>
            );
          })}

          {loading && (
            <Stack direction="row" spacing={1.25}>
              <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
                <SmartToyRounded fontSize="small" />
              </Avatar>
              <Paper sx={{ px: 2, py: 1.5 }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">
                    BugBot is streaming a response...
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
          <div ref={messagesEndRef} />
        </Stack>

        <Divider />

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask BugBot about bugs, projects, dashboard stats, or actions."
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      onClick={handleVoiceInput}
                      color={listening ? "error" : "default"}
                      sx={{
                        border: listening ? "2px solid" : "1px solid transparent",
                        borderColor: listening ? "error.main" : "transparent",
                        animation: listening ? "pulse 1.2s infinite" : "none",
                      }}
                    >
                      <MicOutlined />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography variant="body2" color="text.secondary">
                Press `Enter` to send. Use `Shift + Enter` for a new line.
              </Typography>
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <SendRounded />
                }
                disabled={loading || !draft.trim()}
              >
                Send Message
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
}
