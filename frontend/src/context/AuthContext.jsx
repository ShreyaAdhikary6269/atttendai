import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const USERS_KEY = 'attendai_demo_users';
const SESSION_KEY = 'attendai_demo_session';

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));

  async function signup({ name, email, password }) {
    const users = readJSON(USERS_KEY, []);
    const key = email.trim().toLowerCase();
    if (users.some((u) => u.email === key)) {
      throw new Error('An account with this email already exists.');
    }
    users.push({ name: name.trim(), email: key, passwordHash: await hash(password) });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const session = { name: name.trim(), email: key };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  async function login({ email, password }) {
    const users = readJSON(USERS_KEY, []);
    const key = email.trim().toLowerCase();
    const found = users.find((u) => u.email === key);
    if (!found || found.passwordHash !== (await hash(password))) {
      throw new Error('Incorrect email or password.');
    }
    const session = { name: found.name, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
