// Smartphones — the deep vertical.
//
// Model names stay in Latin script in both languages: that is how these phones
// are marketed, sold and searched for in Kuwait, and "iPhone 15 Pro" transliterated
// into Arabic would be harder to find, not easier.
//
// Spec bullets are NOT written here. They are derived from `attributes` in
// products.js so that what a shopper reads and what the filters match on can
// never drift apart. Prices are Kuwaiti retail, in dinar.

export const phones = [
  // --- Apple ---------------------------------------------------------------
  {
    id: 'iphone-15-pro-max',
    icon: 'phone',
    category: 'phones',
    brand: 'apple',
    badge: { ar: 'الأكثر مبيعًا', en: 'Best Seller' },
    name: { ar: 'iPhone 15 Pro Max', en: 'iPhone 15 Pro Max' },
    description: {
      ar: 'إطار تيتانيوم وزوم بصري ٥x، وأقوى شريحة وضعتها أبل في هاتف.',
      en: 'A titanium frame, 5x optical zoom, and the fastest chip Apple has put in a phone.'
    },
    attributes: { ram: 8, screen: 6.7, battery: 4441, camera: 48, network: '5g', os: 'ios', refreshRate: 120 },
    variants: [
      { id: 'iphone-15-pro-max-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 449.9, stock: 7 },
      { id: 'iphone-15-pro-max-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 519.9, stock: 3 },
      { id: 'iphone-15-pro-max-1tb', label: { ar: '١ تيرا', en: '1TB' }, price: 599.9, stock: 0 }
    ]
  },
  {
    id: 'iphone-15-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone 15 Pro', en: 'iPhone 15 Pro' },
    description: {
      ar: 'نفس قوة البرو ماكس بحجم يريح اليد الواحدة.',
      en: 'The same Pro power in a size you can still use one-handed.'
    },
    attributes: { ram: 8, screen: 6.1, battery: 3274, camera: 48, network: '5g', os: 'ios', refreshRate: 120 },
    variants: [
      { id: 'iphone-15-pro-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 379.9, stock: 12 },
      { id: 'iphone-15-pro-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 419.9, stock: 5 },
      { id: 'iphone-15-pro-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 489.9, stock: 2 }
    ]
  },
  {
    id: 'iphone-15',
    icon: 'phone',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone 15', en: 'iPhone 15' },
    description: {
      ar: 'كاميرا ٤٨ ميجابكسل ومنفذ USB-C، بسعر أقرب للمتناول.',
      en: 'A 48MP camera and USB-C, at a price that lands closer to reach.'
    },
    attributes: { ram: 6, screen: 6.1, battery: 3349, camera: 48, network: '5g', os: 'ios', refreshRate: 60 },
    variants: [
      { id: 'iphone-15-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 289.9, stock: 18 },
      { id: 'iphone-15-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 329.9, stock: 9 }
    ]
  },
  {
    id: 'iphone-14',
    icon: 'phone',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone 14', en: 'iPhone 14' },
    description: {
      ar: 'الجيل السابق بسعر أهدأ، وأداء ما زال ممتازًا لسنوات.',
      en: 'Last year’s flagship at a calmer price, with years of life left in it.'
    },
    attributes: { ram: 6, screen: 6.1, battery: 3279, camera: 12, network: '5g', os: 'ios', refreshRate: 60 },
    variants: [
      { id: 'iphone-14-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 239.9, stock: 14 },
      { id: 'iphone-14-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 279.9, stock: 4 }
    ]
  },
  {
    id: 'iphone-se',
    icon: 'phone',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone SE', en: 'iPhone SE' },
    description: {
      ar: 'أرخص طريق لنظام iOS، بشريحة سريعة وحجم صغير.',
      en: 'The cheapest way into iOS, with a fast chip in a small body.'
    },
    attributes: { ram: 4, screen: 4.7, battery: 2018, camera: 12, network: '5g', os: 'ios', refreshRate: 60 },
    variants: [
      { id: 'iphone-se-64', label: { ar: '٦٤ جيجا', en: '64GB' }, price: 149.9, stock: 21 },
      { id: 'iphone-se-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 169.9, stock: 11 }
    ]
  },

  // --- Samsung -------------------------------------------------------------
  {
    id: 'galaxy-s24-ultra',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'Galaxy S24 Ultra', en: 'Galaxy S24 Ultra' },
    description: {
      ar: 'قلم S Pen وكاميرا ٢٠٠ ميجابكسل وشاشة تقرأها تحت شمس الظهر.',
      en: 'An S Pen, a 200MP camera, and a screen you can read in midday sun.'
    },
    attributes: { ram: 12, screen: 6.8, battery: 5000, camera: 200, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'galaxy-s24-ultra-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 429.9, stock: 9 },
      { id: 'galaxy-s24-ultra-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 489.9, stock: 6 },
      { id: 'galaxy-s24-ultra-1tb', label: { ar: '١ تيرا', en: '1TB' }, price: 559.9, stock: 1 }
    ]
  },
  {
    id: 'galaxy-s24-plus',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy S24+', en: 'Galaxy S24+' },
    description: {
      ar: 'شاشة كبيرة وبطارية تكفي اليوم كامل بدون قلق.',
      en: 'A big screen and a battery that clears a full day without thinking about it.'
    },
    attributes: { ram: 12, screen: 6.7, battery: 4900, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'galaxy-s24-plus-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 329.9, stock: 8 },
      { id: 'galaxy-s24-plus-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 379.9, stock: 3 }
    ]
  },
  {
    id: 'galaxy-s24',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy S24', en: 'Galaxy S24' },
    description: {
      ar: 'حجم مضبوط وأداء رائد، بأدوات ذكاء اصطناعي مدمجة.',
      en: 'Compact size, flagship speed, with AI tools built into the system.'
    },
    attributes: { ram: 8, screen: 6.2, battery: 4000, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'galaxy-s24-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 269.9, stock: 15 },
      { id: 'galaxy-s24-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 299.9, stock: 10 }
    ]
  },
  {
    id: 'galaxy-a55',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy A55', en: 'Galaxy A55' },
    description: {
      ar: 'الخيار المتوازن: شاشة ممتازة وبطارية كبيرة بسعر معقول.',
      en: 'The balanced pick — a great screen and a big battery for sensible money.'
    },
    attributes: { ram: 8, screen: 6.6, battery: 5000, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'galaxy-a55-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 119.9, stock: 24 },
      { id: 'galaxy-a55-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 139.9, stock: 17 }
    ]
  },
  {
    id: 'galaxy-a35',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy A35', en: 'Galaxy A35' },
    description: {
      ar: 'كل الأساسيات مضبوطة، بدون ما تدفع زيادة على أشياء ما تحتاجها.',
      en: 'Every basic done properly, without paying for things you would not use.'
    },
    attributes: { ram: 6, screen: 6.6, battery: 5000, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'galaxy-a35-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 89.9, stock: 30 },
      { id: 'galaxy-a35-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 104.9, stock: 12 }
    ]
  },
  {
    id: 'galaxy-a15',
    icon: 'phone',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy A15', en: 'Galaxy A15' },
    description: {
      ar: 'هاتف يومي بسيط وبطارية تدوم، لأول هاتف أو هاتف احتياطي.',
      en: 'A simple daily phone with lasting battery — a first phone, or a spare.'
    },
    attributes: { ram: 4, screen: 6.5, battery: 5000, camera: 50, network: '4g', os: 'android', refreshRate: 90 },
    variants: [
      { id: 'galaxy-a15-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 49.9, stock: 38 }
    ]
  },

  // --- Xiaomi --------------------------------------------------------------
  {
    id: 'xiaomi-14-ultra',
    icon: 'phone',
    category: 'phones',
    brand: 'xiaomi',
    name: { ar: 'Xiaomi 14 Ultra', en: 'Xiaomi 14 Ultra' },
    description: {
      ar: 'كاميرا بعدسات Leica، لمن يصوّر أكثر مما يتصفح.',
      en: 'Leica optics, for people who shoot more than they scroll.'
    },
    attributes: { ram: 16, screen: 6.73, battery: 5300, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'xiaomi-14-ultra-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 379.9, stock: 4 }
    ]
  },
  {
    id: 'xiaomi-14',
    icon: 'phone',
    category: 'phones',
    brand: 'xiaomi',
    name: { ar: 'Xiaomi 14', en: 'Xiaomi 14' },
    description: {
      ar: 'مواصفات رائدة بحجم صغير وسعر أقل من المنافسين.',
      en: 'Flagship internals in a small body, for less than the obvious rivals.'
    },
    attributes: { ram: 12, screen: 6.36, battery: 4610, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'xiaomi-14-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 259.9, stock: 7 },
      { id: 'xiaomi-14-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 299.9, stock: 5 }
    ]
  },
  {
    id: 'redmi-note-13-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'xiaomi',
    badge: { ar: 'قيمة ممتازة', en: 'Great Value' },
    name: { ar: 'Redmi Note 13 Pro', en: 'Redmi Note 13 Pro' },
    description: {
      ar: 'كاميرا ٢٠٠ ميجابكسل بسعر ما تتوقعه منها أبدًا.',
      en: 'A 200MP camera at a price you would never expect it at.'
    },
    attributes: { ram: 8, screen: 6.67, battery: 5100, camera: 200, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'redmi-note-13-pro-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 79.9, stock: 26 },
      { id: 'redmi-note-13-pro-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 94.9, stock: 13 }
    ]
  },
  {
    id: 'redmi-13c',
    icon: 'phone',
    category: 'phones',
    brand: 'xiaomi',
    name: { ar: 'Redmi 13C', en: 'Redmi 13C' },
    description: {
      ar: 'أرخص هاتف في المتجر، وما زال يشتغل بسلاسة ليومك.',
      en: 'The cheapest phone we stock, and still smooth enough for a normal day.'
    },
    attributes: { ram: 4, screen: 6.74, battery: 5000, camera: 50, network: '4g', os: 'android', refreshRate: 90 },
    variants: [
      { id: 'redmi-13c-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 34.9, stock: 45 }
    ]
  },
  {
    id: 'poco-x6-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'xiaomi',
    name: { ar: 'POCO X6 Pro', en: 'POCO X6 Pro' },
    description: {
      ar: 'أسرع معالج في فئته، مصمم للألعاب قبل أي شيء.',
      en: 'The fastest chip in its class, built for gaming before anything else.'
    },
    attributes: { ram: 12, screen: 6.67, battery: 5000, camera: 64, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'poco-x6-pro-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 89.9, stock: 19 },
      { id: 'poco-x6-pro-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 104.9, stock: 8 }
    ]
  },

  // --- Google --------------------------------------------------------------
  {
    id: 'pixel-8-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'google',
    name: { ar: 'Pixel 8 Pro', en: 'Pixel 8 Pro' },
    description: {
      ar: 'أفضل معالجة صور في السوق، وسبع سنوات تحديثات.',
      en: 'The best photo processing on the market, and seven years of updates.'
    },
    attributes: { ram: 12, screen: 6.7, battery: 5050, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'pixel-8-pro-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 289.9, stock: 6 },
      { id: 'pixel-8-pro-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 329.9, stock: 4 }
    ]
  },
  {
    id: 'pixel-8',
    icon: 'phone',
    category: 'phones',
    brand: 'google',
    name: { ar: 'Pixel 8', en: 'Pixel 8' },
    description: {
      ar: 'أندرويد نظيف بدون إضافات، وكاميرا تصحح لك كل لقطة.',
      en: 'Clean Android with nothing bolted on, and a camera that fixes every shot.'
    },
    attributes: { ram: 8, screen: 6.2, battery: 4575, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'pixel-8-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 209.9, stock: 11 },
      { id: 'pixel-8-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 239.9, stock: 5 }
    ]
  },
  {
    id: 'pixel-8a',
    icon: 'phone',
    category: 'phones',
    brand: 'google',
    name: { ar: 'Pixel 8a', en: 'Pixel 8a' },
    description: {
      ar: 'كاميرا البكسل بنص السعر — أفضل صفقة في القائمة.',
      en: 'Pixel photography at half the price — the best deal on this list.'
    },
    attributes: { ram: 8, screen: 6.1, battery: 4492, camera: 64, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'pixel-8a-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 159.9, stock: 16 }
    ]
  },

  // --- Honor ---------------------------------------------------------------
  {
    id: 'honor-magic6-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'honor',
    name: { ar: 'Honor Magic6 Pro', en: 'Honor Magic6 Pro' },
    description: {
      ar: 'شاشة ساطعة جدًا وبطارية ضخمة، ينافس الرواد مباشرة.',
      en: 'An extremely bright screen and a huge battery, taking flagships head on.'
    },
    attributes: { ram: 12, screen: 6.8, battery: 5600, camera: 180, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'honor-magic6-pro-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 329.9, stock: 5 }
    ]
  },
  {
    id: 'honor-200-pro',
    icon: 'phone',
    category: 'phones',
    brand: 'honor',
    name: { ar: 'Honor 200 Pro', en: 'Honor 200 Pro' },
    description: {
      ar: 'متخصص في تصوير البورتريه، بمعالجة مستوحاة من استوديوهات التصوير.',
      en: 'A portrait specialist, with processing modelled on real photo studios.'
    },
    attributes: { ram: 12, screen: 6.78, battery: 5200, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'honor-200-pro-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 219.9, stock: 9 }
    ]
  },
  {
    id: 'honor-x9b',
    icon: 'phone',
    category: 'phones',
    brand: 'honor',
    name: { ar: 'Honor X9b', en: 'Honor X9b' },
    description: {
      ar: 'شاشة مقاومة للكسر، لمن يوقع هاتفه أكثر من مرة بالشهر.',
      en: 'A drop-resistant screen, for anyone who drops their phone more than once a month.'
    },
    attributes: { ram: 8, screen: 6.78, battery: 5800, camera: 108, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'honor-x9b-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 79.9, stock: 22 }
    ]
  },

  // --- Nothing -------------------------------------------------------------
  {
    id: 'nothing-phone-2',
    icon: 'phone',
    category: 'phones',
    brand: 'nothing',
    name: { ar: 'Nothing Phone (2)', en: 'Nothing Phone (2)' },
    description: {
      ar: 'ظهر شفاف بإضاءة Glyph — الهاتف الوحيد اللي أحد يسألك عنه.',
      en: 'A transparent back with Glyph lighting — the one phone people ask you about.'
    },
    attributes: { ram: 12, screen: 6.7, battery: 4700, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'nothing-phone-2-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 189.9, stock: 7 },
      { id: 'nothing-phone-2-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 219.9, stock: 2 }
    ]
  },
  {
    id: 'nothing-phone-2a',
    icon: 'phone',
    category: 'phones',
    brand: 'nothing',
    name: { ar: 'Nothing Phone (2a)', en: 'Nothing Phone (2a)' },
    description: {
      ar: 'نفس التصميم المميز بسعر النصف تقريبًا.',
      en: 'The same distinctive design for roughly half the price.'
    },
    attributes: { ram: 8, screen: 6.7, battery: 5000, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'nothing-phone-2a-128', label: { ar: '١٢٨ جيجا', en: '128GB' }, price: 99.9, stock: 20 },
      { id: 'nothing-phone-2a-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 114.9, stock: 14 }
    ]
  },

  // --- OnePlus -------------------------------------------------------------
  {
    id: 'oneplus-12',
    icon: 'phone',
    category: 'phones',
    brand: 'oneplus',
    name: { ar: 'OnePlus 12', en: 'OnePlus 12' },
    description: {
      ar: 'شحن سريع جدًا وأداء ثابت تحت الضغط.',
      en: 'Very fast charging, and performance that holds up under pressure.'
    },
    attributes: { ram: 12, screen: 6.82, battery: 5400, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'oneplus-12-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 269.9, stock: 8 },
      { id: 'oneplus-12-512', label: { ar: '٥١٢ جيجا', en: '512GB' }, price: 309.9, stock: 3 }
    ]
  },
  {
    id: 'oneplus-nord-ce4',
    icon: 'phone',
    category: 'phones',
    brand: 'oneplus',
    name: { ar: 'OnePlus Nord CE4', en: 'OnePlus Nord CE4' },
    description: {
      ar: 'يشحن من صفر لنص البطارية في أقل من ١٥ دقيقة.',
      en: 'Charges from empty to half in under 15 minutes.'
    },
    attributes: { ram: 8, screen: 6.7, battery: 5500, camera: 50, network: '5g', os: 'android', refreshRate: 120 },
    variants: [
      { id: 'oneplus-nord-ce4-256', label: { ar: '٢٥٦ جيجا', en: '256GB' }, price: 109.9, stock: 18 }
    ]
  }
];
