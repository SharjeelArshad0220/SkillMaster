import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, signupUser, getMe } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRoadmap, setHasRoadmap] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sm_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getMe();
        setUser(data.user);
        setHasRoadmap(data.hasRoadmap);
      } catch (err) {
        console.error("Auth init failed", err);
        localStorage.removeItem('sm_token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('sm_token', data.token);
    setUser(data.user);
    setHasRoadmap(data.hasRoadmap);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    localStorage.setItem('sm_token', data.token);
    setUser(data.user);
    setHasRoadmap(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sm_token');
    setUser(null);
    setHasRoadmap(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasRoadmap, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
