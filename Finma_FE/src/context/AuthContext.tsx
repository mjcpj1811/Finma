import { createContext, useContext, type ReactNode } from 'react';

type AuthContextValue = {
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <AuthContext.Provider value={{ isAuthenticated: false }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
