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

  // Editing goes through here rather than through the page, so every screen
  // showing the shopper's name updates from one response — the nav greeting and
  // the checkout prefill included.
  const updateProfile = useCallback(async (patch) => {
    const { user: saved } = await api.patch('/me', patch);
    setUser(saved);
    return saved;
  }, []);

  // Deliberately does NOT change `user`: the password is not part of what the
  // app knows about the shopper, and the session survives the change.
  const changePassword = useCallback(
    ({ currentPassword, newPassword }) => api.post('/me/password', { currentPassword, newPassword }),
    []
  );

  const deleteAccount = useCallback(async (password) => {
    const result = await api.del('/me', { password });
    // Only after the server confirms. Clearing first would sign someone out of
    // an account that still exists if the password was wrong.
    setUser(null);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isReady: status === 'ready',
      signUp,
      logIn,
      logOut,
      updateProfile,
      changePassword,
      deleteAccount
    }),
    [user, status, signUp, logIn, logOut, updateProfile, changePassword, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
