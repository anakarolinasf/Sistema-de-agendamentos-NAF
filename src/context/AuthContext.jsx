// AuthContext.jsx - CORRIGIDO
import { createContext, useState } from "react";
import { loginUser } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      if (result.error) {
        throw new Error(result.error);
      }
      
      localStorage.setItem('token', result.token);
      setToken(result.token);
      setUser({
        email: result.email,
        name: result.name,
        role: result.role,
        _id: result._id
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};