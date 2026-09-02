export const categories = ['chargers', 'audio', 'accessories', 'smart'];

export const products = [
  {
    id: 'aero-buds',
    icon: 'earbuds',
    category: 'audio',
    price: 26.9,
    badge: { ar: 'الأكثر مبيعًا', en: 'Best Seller' },
    name: { ar: 'سماعات Aero', en: 'Aero Buds' },
    description: {
      ar: 'سماعات لاسلكية بعزل ضوضاء نشط وصوت نظيف من كل الاتجاهات.',
      en: 'Wireless earbuds with active noise cancellation and clean, directional sound.'
    },
    specs: {
      ar: ['عزل ضوضاء نشط', 'بطارية تدوم 28 ساعة مع العلبة', 'مقاومة للماء IPX4'],
      en: ['Active noise cancellation', '28-hour battery with case', 'IPX4 water resistance']
    }
  },
  {
    id: 'volt-pad',
    icon: 'chargepad',
    category: 'chargers',
    price: 12.5,
    name: { ar: 'قاعدة شحن Volt', en: 'Volt Pad' },
    description: {
      ar: 'شحن لاسلكي سريع بتصميم رفيع يناسب أي مكتب.',
      en: 'Fast wireless charging in a slim profile that fits any desk.'
    },
    specs: {
      ar: ['شحن سريع 15 واط', 'يوقف الشحن تلقائيًا عند الاكتمال', 'قاعدة مانعة للانزلاق'],
      en: ['15W fast charging', 'Auto-stop at full charge', 'Non-slip base']
    }
  },
  {
    id: 'core-bank',
    icon: 'powerbank',
    category: 'chargers',
    price: 9.9,
    name: { ar: 'بطارية Core 10K', en: 'Core Bank 10K' },
    description: {
      ar: 'بطارية محمولة بسعة 10000 مللي أمبير، تشحن هاتفك مرتين كاملتين.',
      en: 'A 10,000mAh power bank that fully charges your phone twice over.'
    },
    specs: {
      ar: ['سعة 10000mAh', 'منفذ USB-C بشحن سريع', 'حجم يدخل الجيب'],
      en: ['10,000mAh capacity', 'USB-C fast charge port', 'Pocket-sized']
    }
  },
  {
    id: 'pulse-watch',
    icon: 'watch',
    category: 'smart',
    price: 39.9,
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'ساعة Pulse', en: 'Pulse Watch' },
    description: {
      ar: 'ساعة ذكية تراقب نبضك ونومك وتتزامن مع هاتفك بسلاسة.',
      en: 'A smartwatch that tracks heart rate and sleep, synced seamlessly to your phone.'
    },
    specs: {
      ar: ['مراقبة نبض القلب', 'بطارية تدوم 6 أيام', 'شاشة AMOLED'],
      en: ['Heart rate monitoring', '6-day battery life', 'AMOLED display']
    }
  },
  {
    id: 'nova-keys',
    icon: 'keyboard',
    category: 'accessories',
    price: 29.9,
    name: { ar: 'لوحة مفاتيح Nova', en: 'Nova Keys' },
    description: {
      ar: 'لوحة مفاتيح ميكانيكية لاسلكية بإضاءة خلفية قابلة للتخصيص.',
      en: 'A wireless mechanical keyboard with customizable backlighting.'
    },
    specs: {
      ar: ['مفاتيح ميكانيكية', 'اتصال لاسلكي وسلكي', 'إضاءة خلفية RGB'],
      en: ['Mechanical switches', 'Wireless + wired connection', 'RGB backlighting']
    }
  },
  {
    id: 'arc-speaker',
    icon: 'speaker',
    category: 'audio',
    price: 21.9,
    name: { ar: 'سماعة Arc', en: 'Arc Speaker' },
    description: {
      ar: 'سماعة بلوتوث مقاومة للماء بصوت قوي يناسب أي مكان.',
      en: 'A water-resistant Bluetooth speaker with powerful sound for anywhere.'
    },
    specs: {
      ar: ['مقاومة للماء IPX6', 'بطارية تدوم 12 ساعة', 'اقتران بلوتوث فوري'],
      en: ['IPX6 water resistance', '12-hour battery', 'Instant Bluetooth pairing']
    }
  },
  {
    id: 'grip-stand',
    icon: 'stand',
    category: 'accessories',
    price: 6.9,
    name: { ar: 'حامل Grip', en: 'Grip Stand' },
    description: {
      ar: 'حامل قابل للطي للهاتف واللابتوب، خفيف ويناسب السفر.',
      en: 'A foldable stand for phone and laptop — light enough to travel with.'
    },
    specs: {
      ar: ['يطوى بالكامل', 'يناسب الهاتف واللابتوب', 'قاعدة ألمنيوم متينة'],
      en: ['Fully foldable', 'Fits phone and laptop', 'Durable aluminum base']
    }
  },
  {
    id: 'beam-hub',
    icon: 'hub',
    category: 'smart',
    price: 18.9,
    name: { ar: 'محور Beam', en: 'Beam Hub' },
    description: {
      ar: 'محور منزل ذكي يربط أجهزتك كلها بتطبيق واحد.',
      en: 'A smart home hub that connects all your devices in one app.'
    },
    specs: {
      ar: ['يدعم Wi-Fi و Bluetooth', 'يتحكم بعدد غير محدود من الأجهزة', 'إعداد خلال دقيقتين'],
      en: ['Wi-Fi + Bluetooth support', 'Unlimited connected devices', '2-minute setup']
    }
  }
];

export function getProduct(id) {
  return products.find((p) => p.id === id);
}

export function getRelated(id, count = 3) {
  const current = getProduct(id);
  if (!current) return [];
  return products
    .filter((p) => p.id !== id && p.category === current.category)
    .slice(0, count)
    .concat(products.filter((p) => p.id !== id && p.category !== current.category))
    .slice(0, count);
}
