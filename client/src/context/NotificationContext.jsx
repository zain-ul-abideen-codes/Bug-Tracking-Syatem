import { createContext, useContext, useMemo, useState } from "react";
import { Alert, Slide, Snackbar } from "@mui/material";

const NotificationContext = createContext({
  notify: () => {},
});

function Transition(props) {
  return <Slide {...props} direction="left" />;
}

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const value = useMemo(
    () => ({
      notify: (message, severity = "info") => {
        setToast({ open: true, message, severity });
      },
    }),
    [],
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
