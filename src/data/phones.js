// Smartphones — the deep vertical.
//
// Lineup and pricing mirror what Xcite actually sells in Kuwait, so the
// comparison is like-for-like.
//
// AUTHORING: a phone declares `storages` and `colors`; the storage x colour
// variant matrix is expanded in products.js. Enumerating variants by hand does
// not scale — the S26 Ultra alone is three storages across four finishes, and
// twelve hand-written variants per phone is where typos and stale prices live.
// Adding a model is a handful of lines, not a dozen variant objects.
//
// Unlike Xcite, one phone is ONE listing. They publish a separate product per
// colour, which is why the same 256GB iPhone 17 Pro Max appears at 389.900,
// 409.900 and 429.900 there depending on the finish.
//
// `soldOut` names specific "storage/colour" combinations that are out of stock,
// so those states are exercised by real data rather than only in theory.
//
// Model names stay in Latin script in both languages: that is how these phones
// are marketed, sold and searched for here.

export const phones = [
  // --- Apple ---------------------------------------------------------------
  {
    id: 'iphone-17-pro-max',
    category: 'phones',
    brand: 'apple',
    badge: { ar: 'الأكثر مبيعًا', en: 'Best Seller' },
    name: { ar: 'iPhone 17 Pro Max', en: 'iPhone 17 Pro Max' },
    description: {
      ar: 'أكبر شاشة وأطول بطارية في أي آيفون، بإطار تيتانيوم.',
      en: 'The biggest screen and longest battery in any iPhone, in a titanium frame.'
    },
    attributes: { screen: 6.9, camera: 48, battery: 4832, refreshRate: 120, os: 'ios' },
    storages: [
      { size: '256GB', price: 389.9 },
      { size: '512GB', price: 449.9 },
      { size: '2TB', price: 639.9 }
    ],
    colors: ['cosmic-orange', 'deep-blue', 'silver'],
    soldOut: ['2TB/silver', '2TB/deep-blue']
  },
  {
    id: 'iphone-17-pro',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone 17 Pro', en: 'iPhone 17 Pro' },
    description: {
      ar: 'نفس قوة البرو ماكس بحجم يريح اليد الواحدة.',
      en: 'The same Pro power in a size you can still use one-handed.'
    },
    attributes: { screen: 6.3, camera: 48, battery: 3988, refreshRate: 120, os: 'ios' },
    storages: [
      { size: '256GB', price: 364.9 },
      { size: '1TB', price: 499.9 }
    ],
    colors: ['deep-blue', 'cosmic-orange', 'silver'],
    soldOut: ['1TB/cosmic-orange']
  },
  {
    id: 'iphone-air',
    category: 'phones',
    brand: 'apple',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'iPhone Air', en: 'iPhone Air' },
    description: {
      ar: 'أنحف آيفون على الإطلاق، بدون تنازل عن الأداء.',
      en: 'The thinnest iPhone ever made, with no compromise on speed.'
    },
    attributes: { screen: 6.5, camera: 48, battery: 3149, refreshRate: 120, os: 'ios' },
    storages: [{ size: '512GB', price: 369.9 }],
    colors: ['light-gold', 'silver', 'black']
  },
  {
    id: 'iphone-15',
    category: 'phones',
    brand: 'apple',
    name: { ar: 'iPhone 15', en: 'iPhone 15' },
    description: {
      ar: 'الطريق الأرخص لنظام iOS، بكاميرا ما زالت ممتازة.',
      en: 'The cheapest way into iOS, with a camera that still holds up.'
    },
    attributes: { screen: 6.1, camera: 48, battery: 3349, refreshRate: 60, os: 'ios' },
    storages: [{ size: '128GB', price: 199.9 }],
    colors: ['black', 'blue', 'pink']
  },

  // --- Samsung -------------------------------------------------------------
  {
    id: 'galaxy-s26-ultra',
    category: 'phones',
    brand: 'samsung',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'Galaxy S26 Ultra', en: 'Galaxy S26 Ultra' },
    description: {
      ar: 'قلم S Pen وكاميرا ٢٠٠ ميجابكسل وشاشة تقرأها تحت شمس الظهر.',
      en: 'An S Pen, a 200MP camera, and a screen you can read in midday sun.'
    },
    attributes: { screen: 6.9, camera: 200, battery: 5000, refreshRate: 120, os: 'android' },
    storages: [
      { size: '256GB', price: 299.9 },
      { size: '512GB', price: 339.9 },
      { size: '1TB', price: 414.9 }
    ],
    colors: ['black', 'white', 'violet', 'blue'],
    soldOut: ['1TB/violet']
  },
  {
    id: 'galaxy-z-fold7',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy Z Fold7', en: 'Galaxy Z Fold7' },
    description: {
      ar: 'هاتف ينفتح ليصير جهازًا لوحيًا كامل الحجم.',
      en: 'A phone that unfolds into a full-size tablet.'
    },
    attributes: { screen: 8.0, camera: 200, battery: 4400, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 429.9 }],
    colors: ['silver', 'black']
  },
  {
    id: 'galaxy-s25-edge',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy S25 Edge', en: 'Galaxy S25 Edge' },
    description: {
      ar: 'أنحف جالاكسي، بإطار تيتانيوم وشاشة كبيرة.',
      en: 'The slimmest Galaxy, with a titanium frame and a big screen.'
    },
    attributes: { screen: 6.7, camera: 200, battery: 3900, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 179.9 }],
    colors: ['titanium-silver', 'titanium-icyblue', 'titanium-jetblack']
  },
  {
    id: 'galaxy-s25-fe',
    category: 'phones',
    brand: 'samsung',
    name: { ar: 'Galaxy S25 FE', en: 'Galaxy S25 FE' },
    description: {
      ar: 'مواصفات قريبة من الرائد بسعر أهدأ بكثير.',
      en: 'Near-flagship specs at a much calmer price.'
    },
    attributes: { screen: 6.7, camera: 50, battery: 4900, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 159.9 }],
    colors: ['white', 'blue', 'navy']
  },

  // --- Huawei --------------------------------------------------------------
  {
    id: 'huawei-pura-90s-pro-max',
    category: 'phones',
    brand: 'huawei',
    name: { ar: 'Huawei Pura 90S Pro Max', en: 'Huawei Pura 90S Pro Max' },
    description: {
      ar: 'كاميرا رائدة وشاشة OLED كبيرة بمعدل تحديث عالٍ.',
      en: 'A flagship camera and a large, high-refresh OLED display.'
    },
    attributes: { screen: 6.9, camera: 50, battery: 5200, refreshRate: 120, os: 'harmonyos' },
    storages: [
      { size: '256GB', price: 329.9 },
      { size: '512GB', price: 349.9 }
    ],
    colors: ['orange', 'gold', 'black']
  },
  {
    id: 'huawei-pura-90s-pro',
    category: 'phones',
    brand: 'huawei',
    name: { ar: 'Huawei Pura 90S Pro', en: 'Huawei Pura 90S Pro' },
    description: {
      ar: 'حجم أصغر وسعر أقل، بنفس لغة التصميم.',
      en: 'A smaller body and a lower price, in the same design language.'
    },
    attributes: { screen: 6.6, camera: 50, battery: 4900, refreshRate: 120, os: 'harmonyos' },
    storages: [{ size: '256GB', price: 249.9 }],
    colors: ['pink', 'orange', 'black']
  },
  {
    id: 'huawei-nova-15-max',
    category: 'phones',
    brand: 'huawei',
    name: { ar: 'Huawei nova 15 Max', en: 'Huawei nova 15 Max' },
    description: {
      ar: 'شاشة ضخمة وبطارية كبيرة بأقل من ١٠٠ دينار.',
      en: 'A huge screen and a big battery for under 100 dinar.'
    },
    attributes: { screen: 6.84, camera: 50, battery: 5500, refreshRate: 120, os: 'harmonyos' },
    storages: [{ size: '256GB', price: 99.9 }],
    colors: ['cyan', 'gold', 'black']
  },

  // --- Honor ---------------------------------------------------------------
  {
    id: 'honor-600',
    category: 'phones',
    brand: 'honor',
    name: { ar: 'Honor 600', en: 'Honor 600' },
    description: {
      ar: 'متخصص في البورتريه، بحجم مريح وسعر متوسط.',
      en: 'A portrait specialist, in a comfortable size at a mid-range price.'
    },
    attributes: { screen: 6.55, camera: 200, battery: 5500, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 129.0 }],
    colors: ['orange', 'gold', 'black']
  },
  {
    id: 'honor-x9d',
    category: 'phones',
    brand: 'honor',
    badge: { ar: 'قيمة ممتازة', en: 'Great Value' },
    name: { ar: 'Honor X9D', en: 'Honor X9D' },
    description: {
      ar: 'شاشة مقاومة للكسر وبطارية ضخمة، لمن يوقع هاتفه كثيرًا.',
      en: 'A drop-resistant screen and a huge battery, for people who drop their phone.'
    },
    attributes: { screen: 6.79, camera: 108, battery: 8300, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 109.0 }],
    colors: ['brown', 'green', 'gold']
  },
  {
    id: 'honor-400-lite',
    category: 'phones',
    brand: 'honor',
    name: { ar: 'Honor 400 Lite', en: 'Honor 400 Lite' },
    description: {
      ar: 'خفيف ونحيف بسعر في المتناول، لكل يوم.',
      en: 'Light and slim at an accessible price, for every day.'
    },
    attributes: { screen: 6.7, camera: 108, battery: 5230, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 79.9 }],
    colors: ['green', 'black']
  },

  // --- Oppo ----------------------------------------------------------------
  {
    id: 'oppo-reno-16',
    category: 'phones',
    brand: 'oppo',
    name: { ar: 'Oppo Reno 16', en: 'Oppo Reno 16' },
    description: {
      ar: 'حجم صغير مريح، وتصوير بورتريه قوي.',
      en: 'A genuinely compact body, with strong portrait photography.'
    },
    attributes: { screen: 6.32, camera: 50, battery: 6000, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 209.9 }],
    colors: ['twilight-violet', 'pop-white']
  },
  {
    id: 'oppo-reno-16f',
    category: 'phones',
    brand: 'oppo',
    name: { ar: 'Oppo Reno 16F', en: 'Oppo Reno 16F' },
    description: {
      ar: 'شاشة أكبر وسعر أقل من رينو ١٦ العادي.',
      en: 'A bigger screen and a lower price than the standard Reno 16.'
    },
    attributes: { screen: 6.67, camera: 50, battery: 6000, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 149.9 }],
    colors: ['pop-white', 'twilight-violet']
  },
  {
    id: 'oppo-a6',
    category: 'phones',
    brand: 'oppo',
    name: { ar: 'Oppo A6', en: 'Oppo A6' },
    description: {
      ar: 'بطارية تدوم يومين وهيكل مقاوم للماء والغبار.',
      en: 'Two-day battery life in a water and dust resistant body.'
    },
    attributes: { screen: 6.75, camera: 50, battery: 6500, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 106.9 }],
    colors: ['gold', 'blue']
  },
  {
    id: 'oppo-a6t',
    category: 'phones',
    brand: 'oppo',
    name: { ar: 'Oppo A6T', en: 'Oppo A6T' },
    description: {
      ar: 'أرخص خيار من أوبو، ببطارية كبيرة وشاشة واسعة.',
      en: 'The most affordable Oppo, with a big battery and a wide screen.'
    },
    attributes: { screen: 6.75, camera: 50, battery: 6500, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 91.9 }],
    colors: ['blue', 'violet']
  },

  // --- Xiaomi --------------------------------------------------------------
  {
    id: 'redmi-note-15-pro',
    category: 'phones',
    brand: 'xiaomi',
    name: { ar: 'Redmi Note 15 Pro', en: 'Redmi Note 15 Pro' },
    description: {
      ar: 'شاشة AMOLED كبيرة وأداء قوي بأقل من ١٠٠ دينار.',
      en: 'A large AMOLED display and real speed for under 100 dinar.'
    },
    attributes: { screen: 6.83, camera: 200, battery: 5800, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 99.9 }],
    colors: ['black', 'blue']
  },

  // --- Tecno ---------------------------------------------------------------
  {
    id: 'tecno-camon-50-ultra',
    category: 'phones',
    brand: 'tecno',
    name: { ar: 'Tecno Camon 50 Ultra', en: 'Tecno Camon 50 Ultra' },
    description: {
      ar: 'كاميرا قوية وشاشة منحنية بسعر متوسط.',
      en: 'A strong camera and a curved display at a mid-range price.'
    },
    attributes: { screen: 6.78, camera: 100, battery: 5200, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 152.9 }],
    colors: ['black', 'gold']
  },
  {
    id: 'tecno-pova-curve-2',
    category: 'phones',
    brand: 'tecno',
    name: { ar: 'Tecno POVA Curve 2', en: 'Tecno POVA Curve 2' },
    description: {
      ar: 'شاشة منحنية وشحن سريع، بسعر تحت ١٣٠ دينار.',
      en: 'A curved screen and fast charging, under 130 dinar.'
    },
    attributes: { screen: 6.78, camera: 64, battery: 6000, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 124.9 }],
    colors: ['storm-titanium', 'melting-silver', 'mystic-purple']
  },
  {
    id: 'tecno-spark-50',
    category: 'phones',
    brand: 'tecno',
    name: { ar: 'Tecno Spark 50', en: 'Tecno Spark 50' },
    description: {
      ar: 'أرخص هاتف ٥G في المتجر، ببطارية ٦٥٠٠ وشحن سريع.',
      en: 'The cheapest 5G phone we stock, with a 6500mAh battery and fast charging.'
    },
    attributes: { screen: 6.78, camera: 50, battery: 6500, refreshRate: 120, os: 'android' },
    storages: [{ size: '256GB', price: 74.9 }],
    colors: ['black', 'cyan']
  }
];
