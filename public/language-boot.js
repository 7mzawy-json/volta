(function applyStoredLanguageBeforePaint() {
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
})();
