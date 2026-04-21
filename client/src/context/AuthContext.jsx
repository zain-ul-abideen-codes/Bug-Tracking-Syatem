import { createContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { loginRequest, logoutRequest, refreshRequest } from "../api/authApi";

export const AuthContext = createContext(null);

const parseJwtExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.exp ? payload.exp * 1000 : null;
  } catch (_error) {
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
      "auth_message",
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
    scheduleRefresh(token);
  };

  const refreshSession = async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshRequest()
        .then((data) => {
          setSession(data.accessToken, data.user);
          return data;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  };

  useEffect(() => {
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
    sessionStorage.removeItem("auth_message");
    setSession(data.accessToken, data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
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
