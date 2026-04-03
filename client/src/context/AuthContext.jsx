import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, signupUser } from "../api/auth.api";
import { saveToken, getToken, clearToken } from "../utils/tokenHelpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — check if token exists, restore user
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const stored = localStorage.getItem("sm_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        clearToken();
        localStorage.removeItem("sm_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    saveToken(data.token);
    localStorage.setItem("sm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user; // caller uses this to decide redirect
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    saveToken(data.token);
    localStorage.setItem("sm_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("sm_user");
    localStorage.removeItem("sm_roadmap_id"); // Clear roadmap persistence
    localStorage.removeItem("sm_roadmap");    // Compatibility with v2 spec
    localStorage.removeItem("sm_progress");   // Compatibility with v2 spec
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
