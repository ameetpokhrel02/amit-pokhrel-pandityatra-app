import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  phone: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  register: (user: User) => void;
  login: (phone: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  const register = (newUser: User) => {
    setRegisteredUsers([...registeredUsers, newUser]);
    console.log('User registered:', newUser);
  };

  const login = (phone: string) => {
    const foundUser = registeredUsers.find(u => u.phone === phone);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    // For testing purposes, if no user is found but we want to allow "ami pokhrel" to work if they just registered:
    // The register function adds to registeredUsers.
    // If the user tries to login with a phone that was just registered, it should work.
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
