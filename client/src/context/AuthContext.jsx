import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { loginRequest, logoutRequest, refreshRequest } from "../api/authApi";

export const AuthContext = createContext(null);
const AUTH_MESSAGE_KEY = "auth_message";
const AUTH_REFRESH_LOCK_KEY = "auth_refresh_lock";
const AUTH_REFRESH_WAIT_MS = 5000;

const parseJwtExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.exp ? payload.exp * 1000 : null;
  } catch (_error) {
    return null;
  }
};

const getRefreshLock = () => {
  const rawLock = localStorage.getItem(AUTH_REFRESH_LOCK_KEY);
  if (!rawLock) {
    return null;
  }

  try {
    const parsedLock = JSON.parse(rawLock);
    if (!parsedLock?.expiresAt || parsedLock.expiresAt <= Date.now()) {
      localStorage.removeItem(AUTH_REFRESH_LOCK_KEY);
      return null;
    }
    return parsedLock;
  } catch (_error) {
    localStorage.removeItem(AUTH_REFRESH_LOCK_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [user, setUser] = useState(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
  );
  const [loading, setLoading] = useState(true);
  const refreshPromiseRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const channelRef = useRef(null);

  const clearSession = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  const handleSessionExpired = () => {
    clearSession();
    sessionStorage.setItem(
      AUTH_MESSAGE_KEY,
      "Your session expired. Please log in again."
    );
    navigate("/login", {
      replace: true,
      state: { sessionExpired: true },
    });
  };

  const scheduleRefresh = (token) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const expiryTime = parseJwtExpiry(token);
    if (!expiryTime) {
      return;
    }

    const refreshInMs = Math.max(expiryTime - Date.now() - 60 * 1000, 5 * 1000);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshSession();
      } catch (_error) {
        handleSessionExpired();
      }
    }, refreshInMs);
  };

  const setSession = (token, authUser) => {
    setAccessToken(token);
    setUser(authUser);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(authUser));
    channelRef.current?.postMessage({ type: "session_updated", token, user: authUser });
    scheduleRefresh(token);
  };

  const waitForSessionUpdate = () =>
    new Promise((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Timed out waiting for shared session update."));
      }, AUTH_REFRESH_WAIT_MS);

      const poller = window.setInterval(() => {
        const sharedToken = localStorage.getItem("accessToken");
        if (sharedToken && sharedToken !== accessToken) {
          const nextUser = localStorage.getItem("user");
          settle({
            accessToken: sharedToken,
            user: nextUser ? JSON.parse(nextUser) : null,
          });
        }
      }, 250);

      const cleanup = () => {
        window.clearTimeout(timeout);
        window.clearInterval(poller);
        window.removeEventListener("storage", handleStorage);
      };

      const settle = (data) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        setAccessToken(data.accessToken);
        setUser(data.user);
        scheduleRefresh(data.accessToken);
        resolve(data);
      };

      const handleStorage = (event) => {
        if (event.key === "accessToken" && event.newValue) {
          const nextUser = localStorage.getItem("user");
          settle({
            accessToken: event.newValue,
            user: nextUser ? JSON.parse(nextUser) : null,
          });
        }
      };

      window.addEventListener("storage", handleStorage);
    });

  const refreshSession = async () => {
    const existingLock = getRefreshLock();
    if (existingLock) {
      return waitForSessionUpdate();
    }

    if (!refreshPromiseRef.current) {
      localStorage.setItem(
        AUTH_REFRESH_LOCK_KEY,
        JSON.stringify({ expiresAt: Date.now() + AUTH_REFRESH_WAIT_MS })
      );

      refreshPromiseRef.current = refreshRequest()
        .then((data) => {
          setSession(data.accessToken, data.user);
          return data;
        })
        .finally(() => {
          localStorage.removeItem(AUTH_REFRESH_LOCK_KEY);
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  };

  useEffect(() => {
    channelRef.current = new BroadcastChannel("bug-tracking-auth");
    channelRef.current.onmessage = (event) => {
      if (event.data?.type === "session_updated") {
        setAccessToken(event.data.token);
        setUser(event.data.user);
        scheduleRefresh(event.data.token);
      }
      if (event.data?.type === "session_cleared") {
        clearSession();
      }
    };

    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response?.status === 401 &&
          !error.config._retry &&
          !error.config.url?.includes("/auth/refresh")
        ) {
          error.config._retry = true;
          try {
            const data = await refreshSession();
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(error.config);
          } catch (refreshError) {
            handleSessionExpired();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      channelRef.current?.close();
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) {
        try {
          await refreshSession();
        } catch (_error) {
          clearSession();
        } finally {
          setLoading(false);
        }
        return;
      }

      const expiryTime = parseJwtExpiry(accessToken);
      if (!expiryTime || expiryTime <= Date.now() + 60 * 1000) {
        try {
          await refreshSession();
        } catch (_error) {
          clearSession();
        } finally {
          setLoading(false);
        }
        return;
      }

      scheduleRefresh(accessToken);
      setLoading(false);
    };

    initializeAuth();
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    sessionStorage.removeItem(AUTH_MESSAGE_KEY);
    setSession(data.accessToken, data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      channelRef.current?.postMessage({ type: "session_cleared" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        login,
        logout,
        loading,
        isAuthenticated: Boolean(user && accessToken),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
