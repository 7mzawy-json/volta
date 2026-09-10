import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'volta-theme';

// Dark on first visit — the original VOLTA identity, and a brand decision rather
// than a device one, so prefers-color-scheme is NOT consulted. An explicit choice
// is remembered and always wins from then on.
//
// public/boot.js applies the same rule before the first paint. This has to agree
// with it: if the two defaults ever differ, the page paints one theme and then
// flips to the other as React mounts.
function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    // Only dark is stamped; light is the bare :root default, so the attribute is
    // removed rather than set to "light". One source of truth, no contradiction
    // between an attribute and the default it duplicates.
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage can be unavailable (private mode); the theme still applies */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
