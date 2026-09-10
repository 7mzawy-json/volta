(function applyStoredPreferencesBeforePaint() {
  // Language and theme both change how the very first frame looks, and both are
  // remembered in localStorage, which React can only read after it mounts. Doing
  // it here — a blocking script above the stylesheet links — is what stops the
  // page painting Arabic-as-LTR or light-then-dark and then correcting itself.
  var language = 'ar';

  try {
    var storedLanguage = localStorage.getItem('volta-lang');
    if (storedLanguage === 'ar' || storedLanguage === 'en') language = storedLanguage;
  } catch {
    // Storage can be unavailable in privacy-restricted contexts. Arabic is the
    // document default, so the storefront remains usable without persistence.
  }

  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

  // Dark on first visit — the original VOLTA identity, and a brand decision
  // rather than a device one, so prefers-color-scheme is NOT consulted. An
  // explicit choice is remembered and wins from then on.
  //
  // Only dark is stamped: light is the bare :root default in the stylesheet, so
  // the attribute is removed rather than set to "light". That keeps one source
  // of truth instead of an attribute that duplicates a default and can disagree
  // with it.
  var theme = 'dark';

  try {
    var storedTheme = localStorage.getItem('volta-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') theme = storedTheme;
  } catch {
    // Same as above: without storage the brand default applies every time.
  }

  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
})();
