// Colour registry.
//
// One entry per finish sold, with the hex used both for the filter swatch and
// for tinting the product render, so a Cosmic Orange phone actually looks
// Cosmic Orange rather than showing a generic icon. `dark` marks finishes that
// need light-coloured detailing drawn on top of them.

export const colors = {
  'cosmic-orange': { hex: '#C2622E', dark: true, name: { ar: 'برتقالي كوني', en: 'Cosmic Orange' } },
  'deep-blue': { hex: '#2C3A57', dark: true, name: { ar: 'أزرق داكن', en: 'Deep Blue' } },
  silver: { hex: '#D6D9DD', dark: false, name: { ar: 'فضي', en: 'Silver' } },
  'light-gold': { hex: '#E4D5B7', dark: false, name: { ar: 'ذهبي فاتح', en: 'Light Gold' } },
  black: { hex: '#1D1D1F', dark: true, name: { ar: 'أسود', en: 'Black' } },
  white: { hex: '#F1F1EF', dark: false, name: { ar: 'أبيض', en: 'White' } },
  violet: { hex: '#7B6CA6', dark: true, name: { ar: 'بنفسجي', en: 'Violet' } },
  blue: { hex: '#4A6FA5', dark: true, name: { ar: 'أزرق', en: 'Blue' } },
  navy: { hex: '#2A3550', dark: true, name: { ar: 'كحلي', en: 'Navy' } },
  'titanium-silver': { hex: '#C7C4BE', dark: false, name: { ar: 'تيتانيوم فضي', en: 'Titanium Silver' } },
  'titanium-icyblue': { hex: '#A9BFCF', dark: false, name: { ar: 'تيتانيوم أزرق ثلجي', en: 'Titanium Icyblue' } },
  'titanium-jetblack': { hex: '#232326', dark: true, name: { ar: 'تيتانيوم أسود', en: 'Titanium Jetblack' } },
  green: { hex: '#4E7A5E', dark: true, name: { ar: 'أخضر', en: 'Green' } },
  gold: { hex: '#C7A85F', dark: false, name: { ar: 'ذهبي', en: 'Gold' } },
  brown: { hex: '#6B5344', dark: true, name: { ar: 'بني', en: 'Brown' } },
  orange: { hex: '#D57A33', dark: true, name: { ar: 'برتقالي', en: 'Orange' } },
  pink: { hex: '#DFA7B7', dark: false, name: { ar: 'وردي', en: 'Pink' } },
  cyan: { hex: '#6BC0CB', dark: false, name: { ar: 'سماوي', en: 'Cyan' } },
  'storm-titanium': { hex: '#585B61', dark: true, name: { ar: 'تيتانيوم عاصف', en: 'Storm Titanium' } },
  'melting-silver': { hex: '#CFD3D6', dark: false, name: { ar: 'فضي ذائب', en: 'Melting Silver' } },
  'mystic-purple': { hex: '#6E5A8C', dark: true, name: { ar: 'بنفسجي غامض', en: 'Mystic Purple' } },
  'pop-white': { hex: '#F4F2EE', dark: false, name: { ar: 'أبيض ناصع', en: 'Pop White' } },
  'twilight-violet': { hex: '#5B4A79', dark: true, name: { ar: 'بنفسجي الغسق', en: 'Twilight Violet' } }
};

export function getColor(id) {
  return colors[id] || { hex: '#8A8A8E', dark: true, name: { ar: id, en: id } };
}
