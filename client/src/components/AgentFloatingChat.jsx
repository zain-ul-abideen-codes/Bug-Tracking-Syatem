import { useEffect, useMemo, useRef, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import useAgentChat from "../hooks/useAgentChat";
import useAuth from "../hooks/useAuth";
import BugBotRenderer from "./BugBotRenderer";

const quickPromptsByRole = {
  administrator: [
    { label: "Dashboard Stats", message: "Show me dashboard statistics" },
    { label: "Open Bugs", message: "Show all open bugs" },
    { label: "My Projects", message: "Show my projects" },
    { label: "Critical Bugs", message: "Show critical priority bugs" },
  ],
  manager: [
    { label: "Project Load", message: "Show my projects and their bug counts" },
    { label: "Open Bugs", message: "Show open bugs in my projects" },
    { label: "Unassigned", message: "Show unassigned bugs" },
    { label: "Dashboard", message: "Show dashboard statistics" },
  ],
  qa: [
    { label: "My Bugs", message: "Show bugs I reported" },
    { label: "New Bugs", message: "Show new bugs" },
    { label: "Search Login", message: "Find bugs related to login" },
    { label: "My Projects", message: "Show my projects" },
  ],
  developer: [
    { label: "My Bugs", message: "Show my assigned bugs" },
    { label: "Started", message: "Show my started issues" },
    { label: "Workload", message: "What's my workload today?" },
    { label: "Critical", message: "Show my critical bugs" },
  ],
};

export default function AgentFloatingChat() {
  const { user } = useAuth();
  const {
    messages,
    loading,
    error,
    sendMessage,
    startNewChat,
  } = useAgentChat();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = useMemo(
    () => quickPromptsByRole[user?.role] || quickPromptsByRole.developer,
    [user?.role],
  );

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const submitMessage = async (message = draft) => {
    const nextMessage = message.trim();
    if (!nextMessage || loading) return;
    setDraft("");
    await sendMessage(nextMessage);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`agent-chat-bubble ${open ? "bubble-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        title="BugBot AI Assistant"
      >
        {open ? <CloseRoundedIcon /> : <SmartToyRoundedIcon />}
        {!open ? <span className="bubble-pulse" /> : null}
      </button>

      <div className={`agent-chat-panel ${open ? "panel-open" : ""}`}>
        <div className="agent-chat-header">
          <div className="agent-header-left">
            <div className="agent-avatar">
              <SmartToyRoundedIcon fontSize="small" />
            </div>
            <div className="agent-header-info">
              <h3>BugBot Intelligence</h3>
              <span className="agent-status">
                <span className="status-dot" />
                Role-safe AI Agent
              </span>
              <span className="agent-session-count">Session: {messages.length} messages</span>
            </div>
          </div>
          <div className="agent-header-actions">
            <button type="button" className="agent-header-btn" onClick={startNewChat} title="Clear chat">
              <DeleteSweepRoundedIcon fontSize="small" />
            </button>
            <button type="button" className="agent-header-btn" onClick={() => setOpen(false)} title="Close">
              <CloseRoundedIcon fontSize="small" />
            </button>
          </div>
        </div>

        <div className="agent-messages">
          {messages.length === 0 ? (
            <>
              <div className="agent-welcome-card">
                <div className="agent-welcome-icon">
                  <SmartToyRoundedIcon />
                </div>
                <strong>Ask BugBot anything</strong>
                <span>It can read projects, bugs, dashboard stats, and role-safe workflow data.</span>
              </div>
              <div className="quick-actions">
                <p className="quick-actions-label">Quick actions</p>
                <div className="quick-actions-grid">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.message}
                      type="button"
                      className="quick-action-btn"
                      onClick={() => {
                        setDraft(prompt.message);
                        inputRef.current?.focus();
                      }}
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id} className={`message-wrapper ${isUser ? "user-wrapper" : "bot-wrapper"}`}>
                {!isUser ? (
                  <div className="bot-avatar-small">
                    <SmartToyRoundedIcon fontSize="inherit" />
                  </div>
                ) : null}
                <div className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
                  <div className="message-content">
                    {isUser ? message.content : <BugBotRenderer content={message.content || ""} />}
                  </div>
                  {Array.isArray(message.toolActivity) && message.toolActivity.length > 0 ? (
                    <div className="tools-used">
                      {message.toolActivity.map((tool) => (
                        <span key={`${tool.tool}-${tool.status}`} className="tool-badge">
                          {tool.status === "done" ? "Done" : "Running"} {String(tool.tool || "").replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {!isUser && message.metrics?.tokensUsed ? (
                    <div className="tools-used">
                      <span className="tool-badge">{message.metrics.tokensUsed} tokens used</span>
                    </div>
                  ) : null}
                  {Array.isArray(message.suggestions) && message.suggestions.length > 0 ? (
                    <div className="tools-used">
                      {message.suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="tool-suggestion-btn"
                          onClick={() => {
                            setDraft(suggestion);
                            inputRef.current?.focus();
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {loading ? (
            <div className="message-wrapper bot-wrapper">
              <div className="bot-avatar-small">
                <SmartToyRoundedIcon fontSize="inherit" />
              </div>
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className="agent-input-area">
          {error ? <div className="agent-error">{error}</div> : null}
          <div className="agent-input-wrapper">
            <textarea
              ref={inputRef}
              className="agent-input"
              placeholder="Ask BugBot about bugs, projects, stats..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              type="button"
              className="agent-send-btn"
              onClick={() => submitMessage()}
              disabled={!draft.trim() || loading}
            >
              {loading ? <span className="send-spinner" /> : <SendRoundedIcon fontSize="small" />}
            </button>
          </div>
          <p className="agent-input-hint">Enter to send, Shift + Enter for new line</p>
        </div>
      </div>

      {open ? <button type="button" className="agent-backdrop" aria-label="Close BugBot" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
