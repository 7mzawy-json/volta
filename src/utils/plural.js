// Picks the right plural form for a count.
//
// English needs two forms; Arabic needs six (zero, one, two, few, many, other),
// which is why the copy stores a map per language rather than a single string
// with an "s" bolted on. Intl.PluralRules decides which key applies.

const rules = {
  ar: new Intl.PluralRules('ar'),
  en: new Intl.PluralRules('en')
};

export function plural(forms, count, lang = 'ar') {
  if (typeof forms === 'string') return forms;
  const rule = rules[lang] || rules.en;
  return forms[rule.select(count)] || forms.other || forms.one || '';
}
