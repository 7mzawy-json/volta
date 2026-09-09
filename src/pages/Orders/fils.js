// The API stores money in fils — whole thousandths of a dinar — because
// 0.1 + 0.2 is not 0.3 in binary floating point and an order total that is a
// fraction out is simply wrong. Display code works in dinar, so the conversion
// happens once, here, rather than as a scattered "/ 1000".
export const FILS_PER_DINAR = 1000;

export function filsToDinar(fils) {
  return fils / FILS_PER_DINAR;
}
