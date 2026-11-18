import { createContext, useContext, useMemo, useState } from "react";
import api from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fundguard_user") || "null"); }
    catch { return null; }
  });

  const acceptSession = ({ token, user: nextUser }) => {
    localStorage.setItem("fundguard_token", token);
    localStorage.setItem("fundguard_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };
  const login = async (email, password) => acceptSession((await api.post("/auth/login", { email, password })).data);
  const register = async (name, email, password) => acceptSession((await api.post("/auth/register", { name, email, password })).data);
  const logout = () => {
    localStorage.removeItem("fundguard_token");
    localStorage.removeItem("fundguard_user");
    setUser(null);
  };
  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
