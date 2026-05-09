import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Slide, Snackbar } from "@mui/material";

const HISTORY_KEY = "bugtracker-pro-notification-history";
const SILENT_MESSAGES = new Set(["Authentication required."]);

const NotificationContext = createContext({
  notify: () => {},
  history: [],
  unreadCount: 0,
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearHistory: () => {},
});

function Transition(props) {
  return <Slide {...props} direction="left" />;
}

export function NotificationProvider({ children }) {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.filter((entry) => !SILENT_MESSAGES.has(entry.message));
    } catch (_error) {
      return [];
    }
  });
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const value = useMemo(
    () => ({
      notify: (message, severity = "info") => {
        if (SILENT_MESSAGES.has(message)) {
          return;
        }

        const nextEntry = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          message,
          severity,
          createdAt: new Date().toISOString(),
          read: false,
        };
        setHistory((current) => [nextEntry, ...current].slice(0, 50));
        setToast({ open: true, message, severity });
      },
      history,
      unreadCount: history.filter((entry) => !entry.read).length,
      markAllAsRead: () =>
        setHistory((current) => current.map((entry) => ({ ...entry, read: true }))),
      removeNotification: (id) =>
        setHistory((current) => current.filter((entry) => entry.id !== id)),
      clearHistory: () => setHistory([]),
    }),
    [history],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
