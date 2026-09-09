import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

// The session lives in an httpOnly cookie, which scripts cannot read by design.
// So the app cannot know on boot whether it is signed in — it has to ask. That
// is the whole reason for the `status` field: "checking" is a real state, and
// rendering a signed-out header during it makes the page flicker for anyone who
// IS signed in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | ready

  useEffect(() => {
    let cancelled = false;
    api
      .get('/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        // 401 is the ordinary answer for a visitor, not an error worth showing.
      })
      .finally(() => {
        if (!cancelled) setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signUp = useCallback(async ({ email, name, password }) => {
    const { user: created } = await api.post('/signup', { email, name, password });
    setUser(created);
    return created;
  }, []);

  const logIn = useCallback(async ({ email, password }) => {
    const { user: found } = await api.post('/login', { email, password });
    setUser(found);
    return found;
  }, []);

  const logOut = useCallback(async () => {
    try {
      await api.post('/logout');
    } finally {
      // Clear locally even if the request failed: the alternative is a UI that
      // insists you are signed in when you asked not to be.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isReady: status === 'ready', signUp, logIn, logOut }),
    [user, status, signUp, logIn, logOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
