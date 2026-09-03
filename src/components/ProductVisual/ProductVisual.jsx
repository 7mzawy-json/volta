import DeviceRender from '../DeviceRender/DeviceRender.jsx';
import AccessoryRender from '../AccessoryRender/AccessoryRender.jsx';
import ProductGlyph from '../ProductGlyph/ProductGlyph.jsx';
import { getProductColors } from '../../data/products.js';

// Picks the right visual for a product.
//
// One place decides, so the card, the product page and the search panel cannot
// drift apart — the branch used to be repeated at each call site, which is how a
// phone ends up rendered as a glyph in one view and a device in another.
//
// Falls back to the outline glyph if a product has no colour, which keeps this
// safe for any future listing added without a finish.
export default function ProductVisual({ product, color, size = 72, className = '' }) {
  const finish = color || getProductColors(product)[0];

  if (product.category === 'phones') {
    return (
      <DeviceRender
        color={finish}
        brand={product.brand}
        wide={product.attributes?.screen >= 7.5}
        size={size}
        className={className}
      />
    );
  }

  if (finish) {
    return <AccessoryRender icon={product.icon} color={finish} size={size} className={className} />;
  }

  return <ProductGlyph icon={product.icon} size={size} className={className} />;
}
