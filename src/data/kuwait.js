// Kuwaiti addressing.
//
// Kuwait is divided into six governorates, each containing multiple cities and
// areas. A delivery address therefore carries both levels before block, street
// and building — not a western "street address, city" pair. Getting this right
// is the same class of decision as pricing in dinar at three decimals: it is the
// difference between a storefront built for this market and one merely
// translated into it.

export const governorates = [
  { id: 'capital', name: { ar: 'العاصمة', en: 'Capital' } },
  { id: 'hawalli', name: { ar: 'حولي', en: 'Hawalli' } },
  { id: 'farwaniya', name: { ar: 'الفروانية', en: 'Farwaniya' } },
  { id: 'mubarak', name: { ar: 'مبارك الكبير', en: 'Mubarak Al-Kabeer' } },
  { id: 'ahmadi', name: { ar: 'الأحمدي', en: 'Ahmadi' } },
  { id: 'jahra', name: { ar: 'الجهراء', en: 'Jahra' } }
];

export const governorateIds = governorates.map((g) => g.id);

export function getGovernorate(id) {
  return governorates.find((g) => g.id === id) || null;
}

// Kuwaiti mobile numbers are 8 digits and begin with 5, 6 or 9. Landlines start
// with 2, which is not useful for a delivery contact, so mobiles only.
export function isKuwaitiMobile(value) {
  const digits = value.replace(/\D/g, '');
  // Tolerate the +965 country code, with or without the plus.
  const local = digits.startsWith('965') && digits.length > 8 ? digits.slice(3) : digits;
  return /^[569]\d{7}$/.test(local);
}
