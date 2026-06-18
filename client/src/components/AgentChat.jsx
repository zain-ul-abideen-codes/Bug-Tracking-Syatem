import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { DeleteSweepRounded, MicOutlined, SendRounded } from "@mui/icons-material";
import useAgentChat from "../hooks/useAgentChat";
import BugBotRenderer from "./BugBotRenderer";
import useAuth from "../hooks/useAuth";

const rolePrompts = {
  administrator: [
    { label: "Stats", message: "Show dashboard statistics" },
    { label: "Open Bugs", message: "Show all open bugs" },
    { label: "Projects", message: "Show my projects" },
    { label: "Critical", message: "Show critical priority bugs" },
  ],
  manager: [
    { label: "Project Load", message: "Show my projects and their bug counts" },
    { label: "Open Bugs", message: "Show open bugs in my projects" },
    { label: "Unassigned", message: "Show unassigned bugs" },
    { label: "Stats", message: "Show dashboard statistics" },
  ],
  qa: [
    { label: "My Bugs", message: "Show bugs I reported" },
    { label: "New Bugs", message: "Show new bugs" },
    { label: "Login Bugs", message: "Find bugs related to login" },
    { label: "Projects", message: "Show my projects" },
  ],
  developer: [
    { label: "My Bugs", message: "Show my assigned bugs" },
    { label: "Started", message: "Show my started issues" },
    { label: "Workload", message: "What's my workload today?" },
    { label: "Critical", message: "Show my critical bugs" },
  ],
};

const formatTime = () =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

export default function AgentChat({ chat }) {
  const { user } = useAuth();
  const agentChat = chat || useAgentChat();
  const { messages, alerts, sessionId, loading, error, sendMessage, startNewChat } = agentChat;
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const suggestions = useMemo(() => rolePrompts[user?.role] || rolePrompts.developer, [user?.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submitMessage = async (message = draft) => {
    const nextMessage = message.trim();
    if (!nextMessage || loading) return;
    setDraft("");
    await sendMessage(nextMessage);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
    }
  };

  const handleVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      setDraft(event.results[0][0].transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  return (
    <Paper
      sx={{
        overflow: "hidden",
        border: "1px solid rgba(124,58,237,0.28)",
        borderRadius: 5,
        bgcolor: "#0a0f1e",
        color: "#e2e8f0",
        boxShadow: "0 30px 90px rgba(15,23,42,0.45)",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.16)",
                fontSize: 24,
              }}
            >
              BOT
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>
                BugBot
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(226,232,240,0.85)" }}>
                Online | Session: {messages.length} messages{sessionId ? ` | ${sessionId.slice(0, 8)}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<DeleteSweepRounded />}
            onClick={startNewChat}
            sx={{ color: "#0f172a", fontWeight: 900 }}
          >
            Clear
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2.25, borderBottom: "1px solid #334155", bgcolor: "#0f172a" }}>
        <Typography sx={{ mb: 1.25, color: "#94a3b8", fontWeight: 800 }}>
          Quick actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1,
          }}
        >
          {suggestions.map((prompt) => (
            <Button
              key={prompt.message}
              variant="outlined"
              onClick={() => {
                setDraft(prompt.message);
                inputRef.current?.focus();
              }}
              sx={{
                justifyContent: "flex-start",
                borderColor: "rgba(124,58,237,0.45)",
                color: "#c4b5fd",
                textTransform: "none",
                "&:hover": { borderColor: "#7c3aed", bgcolor: "rgba(124,58,237,0.12)" },
              }}
            >
              {prompt.label}
            </Button>
          ))}
        </Box>
      </Box>

      {alerts.length > 0 ? (
        <Stack spacing={1} sx={{ p: 2, bgcolor: "#0f172a" }}>
          {alerts.map((alert) => (
            <Alert key={alert.message} severity={alert.severity || "warning"}>
              {alert.message}
            </Alert>
          ))}
        </Stack>
      ) : null}

      <Stack
        spacing={2}
        sx={{
          height: { xs: "58vh", md: 560 },
          overflowY: "auto",
          p: 2.5,
          bgcolor: "#0a0f1e",
          scrollbarColor: "#334155 transparent",
        }}
      >
        {messages.length === 0 ? (
          <Paper
            sx={{
              p: 3,
              textAlign: "center",
              border: "1px dashed rgba(124,58,237,0.45)",
              bgcolor: "rgba(30,41,59,0.56)",
              color: "#e2e8f0",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Start chatting with BugBot
            </Typography>
            <Typography sx={{ color: "#94a3b8" }}>
              Ask about bugs, projects, dashboard stats, or role-safe workflow actions.
            </Typography>
          </Paper>
        ) : null}

        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <Stack
              key={message.id}
              direction="row"
              spacing={1.25}
              sx={{
                justifyContent: isUser ? "flex-end" : "flex-start",
                animation: "fadeIn 0.25s ease",
              }}
            >
              {!isUser ? (
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    bgcolor: "#1e293b",
                    border: "1px solid rgba(124,58,237,0.35)",
                    color: "#c4b5fd",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  BOT
                </Box>
              ) : null}
              <Paper
                sx={{
                  maxWidth: "min(86%, 720px)",
                  px: 2,
                  py: 1.5,
                  borderRadius: isUser ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                  color: isUser ? "#fff" : "#e2e8f0",
                  bgcolor: isUser ? "transparent" : "#1a2235",
                  background: isUser ? "linear-gradient(135deg, #7c3aed, #2563eb)" : "#1a2235",
                  border: isUser ? "none" : "1px solid rgba(124,58,237,0.22)",
                }}
              >
                {isUser ? (
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>{message.content}</Typography>
                ) : (
                  <BugBotRenderer content={message.content || ""} />
                )}

                {!isUser && Array.isArray(message.toolActivity) && message.toolActivity.length > 0 ? (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                    {message.toolActivity.map((item) => (
                      <Chip
                        key={`${item.tool}-${item.status}`}
                        size="small"
                        label={`${item.status === "done" ? "Done" : "Running"} ${String(item.tool || "").replace(/_/g, " ")}`}
                        sx={{
                          bgcolor: "rgba(124,58,237,0.16)",
                          border: "1px solid rgba(124,58,237,0.3)",
                          color: "#c4b5fd",
                          fontWeight: 800,
                        }}
                      />
                    ))}
                  </Stack>
                ) : null}

                {!isUser && message.metrics?.tokensUsed ? (
                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#64748b" }}>
                    {message.metrics.tokensUsed} tokens
                  </Typography>
                ) : null}

                {!isUser && Array.isArray(message.suggestions) && message.suggestions.length > 0 ? (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                    {message.suggestions.map((suggestion) => (
                      <Chip
                        key={suggestion}
                        label={suggestion}
                        variant="outlined"
                        size="small"
                        clickable
                        onClick={() => {
                          setDraft(suggestion);
                          inputRef.current?.focus();
                        }}
                        sx={{ borderColor: "#334155", color: "#94a3b8" }}
                      />
                    ))}
                  </Stack>
                ) : null}

                <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: isUser ? "rgba(255,255,255,0.65)" : "#64748b" }}>
                  {formatTime()}
                </Typography>
              </Paper>
            </Stack>
          );
        })}

        {loading ? (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                bgcolor: "#1e293b",
                border: "1px solid rgba(124,58,237,0.35)",
                color: "#c4b5fd",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              BOT
            </Box>
            <Paper sx={{ px: 2, py: 1.5, bgcolor: "#1a2235", border: "1px solid rgba(124,58,237,0.22)" }}>
              <Stack direction="row" spacing={0.75}>
                {[0, 1, 2].map((item) => (
                  <Box
                    key={item}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#7c3aed",
                      animation: "pulse 1s infinite",
                      animationDelay: `${item * 0.15}s`,
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          </Stack>
        ) : null}
        <div ref={messagesEndRef} />
      </Stack>

      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, borderTop: "1px solid #334155", bgcolor: "#0f172a" }}>
        <Stack spacing={1.25}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
            <IconButton
              onClick={handleVoiceInput}
              sx={{
                color: listening ? "#f87171" : "#94a3b8",
                border: "1px solid #334155",
                bgcolor: "#1e293b",
              }}
            >
              <MicOutlined />
            </IconButton>
            <TextField
              inputRef={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask BugBot about bugs, projects, stats..."
              multiline
              minRows={1}
              maxRows={5}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#1e293b",
                  color: "#e2e8f0",
                  borderRadius: 3,
                  "& fieldset": { borderColor: "#334155" },
                  "&:hover fieldset": { borderColor: "#7c3aed" },
                  "&.Mui-focused fieldset": { borderColor: "#7c3aed" },
                },
                "& textarea::placeholder": { color: "#64748b", opacity: 1 },
              }}
            />
            <IconButton
              type="submit"
              disabled={loading || !draft.trim()}
              sx={{
                width: 48,
                height: 48,
                color: "#fff",
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                "&:hover": { background: "linear-gradient(135deg, #6d28d9, #1d4ed8)" },
                "&.Mui-disabled": { bgcolor: "#334155", color: "#64748b" },
              }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : <SendRounded />}
            </IconButton>
          </Stack>
          <Typography variant="caption" sx={{ color: "#64748b", textAlign: "center" }}>
            Press Enter to send. Shift + Enter for new line.
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
