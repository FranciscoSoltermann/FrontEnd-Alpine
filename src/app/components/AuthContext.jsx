// src/app/components/AuthContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Al cargar, intentar leer el usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Función de Login: guarda el usuario en el estado Y en localStorage
  const login = (userData) => {
    localStorage.setItem('usuario', JSON.stringify(userData));
    setUser(userData);
  };

  // Función de Logout: borra al usuario del estado Y de localStorage
  const logout = () => {
    localStorage.removeItem('usuario');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para que otros componentes usen este "cerebro"
export const useAuth = () => {
  return useContext(AuthContext);
};