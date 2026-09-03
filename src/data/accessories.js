// Accessories.
//
// VOLTA-branded, unlike the phones, which mirror real market stock. These are
// the shop's own line, so names, prices and specs are ours to set.
//
// AUTHORING: an accessory declares `colors` and one `price`. products.js expands
// that into one variant per finish, the same way phones expand storage x colour,
// so accessories flow through the identical cart, filter and render paths rather
// than being a second-class shape with its own branches.
//
// Where a product genuinely comes in two capacities (the power banks), it is two
// LISTINGS rather than a capacity axis. That is how such things are usually
// shelved, and it avoids bending the variant model around one product type.

export const accessories = [
  // --- audio ---------------------------------------------------------------
  {
    id: 'aero-buds',
    icon: 'earbuds',
    category: 'audio',
    brand: 'volta',
    badge: { ar: 'الأكثر مبيعًا', en: 'Best Seller' },
    name: { ar: 'سماعات Aero', en: 'Aero Buds' },
    description: {
      ar: 'سماعات لاسلكية بعزل ضوضاء نشط وصوت نظيف من كل الاتجاهات.',
      en: 'Wireless earbuds with active noise cancellation and clean, directional sound.'
    },
    attributes: { anc: true, batteryHours: 28, waterResistance: 'IPX4', connection: 'wireless' },
    specs: {
      ar: ['عزل ضوضاء نشط', 'بطارية تدوم 28 ساعة مع العلبة', 'مقاومة للماء IPX4'],
      en: ['Active noise cancellation', '28-hour battery with case', 'IPX4 water resistance']
    },
    price: 26.9,
    colors: ['white', 'black', 'navy']
  },
  {
    id: 'aero-buds-lite',
    icon: 'earbuds',
    category: 'audio',
    brand: 'volta',
    name: { ar: 'سماعات Aero Lite', en: 'Aero Buds Lite' },
    description: {
      ar: 'نفس شكل Aero وصوت نظيف، بدون عزل الضوضاء وبنص السعر.',
      en: 'The same shape and clean sound as Aero, without ANC and at half the price.'
    },
    attributes: { anc: false, batteryHours: 20, waterResistance: 'IPX4', connection: 'wireless' },
    specs: {
      ar: ['بطارية تدوم 20 ساعة مع العلبة', 'مقاومة للماء IPX4', 'اقتران فوري'],
      en: ['20-hour battery with case', 'IPX4 water resistance', 'Instant pairing']
    },
    price: 13.9,
    colors: ['white', 'black']
  },
  {
    id: 'halo-headphones',
    icon: 'headphones',
    category: 'audio',
    brand: 'volta',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'سماعات Halo', en: 'Halo Headphones' },
    description: {
      ar: 'سماعات رأس بعزل ضوضاء قوي ووسائد تريح الأذن لساعات طويلة.',
      en: 'Over-ear headphones with deep noise cancellation and pads built for long sessions.'
    },
    attributes: { anc: true, batteryHours: 45, connection: 'wireless' },
    specs: {
      ar: ['عزل ضوضاء نشط', 'بطارية تدوم 45 ساعة', 'وسائد بروتين ناعمة'],
      en: ['Active noise cancellation', '45-hour battery', 'Soft protein-leather pads']
    },
    price: 44.9,
    colors: ['black', 'silver', 'navy']
  },
  {
    id: 'arc-speaker',
    icon: 'speaker',
    category: 'audio',
    brand: 'volta',
    name: { ar: 'سماعة Arc', en: 'Arc Speaker' },
    description: {
      ar: 'سماعة بلوتوث مقاومة للماء بصوت قوي يناسب أي مكان.',
      en: 'A water-resistant Bluetooth speaker with powerful sound for anywhere.'
    },
    attributes: { batteryHours: 12, waterResistance: 'IPX6', connection: 'wireless' },
    specs: {
      ar: ['مقاومة للماء IPX6', 'بطارية تدوم 12 ساعة', 'اقتران بلوتوث فوري'],
      en: ['IPX6 water resistance', '12-hour battery', 'Instant Bluetooth pairing']
    },
    price: 21.9,
    colors: ['black', 'green', 'orange']
  },

  // --- chargers ------------------------------------------------------------
  {
    id: 'volt-pad',
    icon: 'chargepad',
    category: 'chargers',
    brand: 'volta',
    name: { ar: 'قاعدة شحن Volt', en: 'Volt Pad' },
    description: {
      ar: 'شحن لاسلكي سريع بتصميم رفيع يناسب أي مكتب.',
      en: 'Fast wireless charging in a slim profile that fits any desk.'
    },
    attributes: { wattage: 15, connection: 'wireless' },
    specs: {
      ar: ['شحن سريع 15 واط', 'يوقف الشحن تلقائيًا عند الاكتمال', 'قاعدة مانعة للانزلاق'],
      en: ['15W fast charging', 'Auto-stop at full charge', 'Non-slip base']
    },
    price: 12.5,
    colors: ['black', 'white']
  },
  {
    id: 'tri-dock',
    icon: 'dock',
    category: 'chargers',
    brand: 'volta',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'حامل Tri Dock', en: 'Tri Dock' },
    description: {
      ar: 'يشحن الهاتف والساعة والسماعات من قاعدة وحدة على طاولة السرير.',
      en: 'Charges phone, watch and buds from one base on your bedside table.'
    },
    attributes: { wattage: 25, connection: 'wireless', ports: 3 },
    specs: {
      ar: ['ثلاثة أجهزة بنفس الوقت', 'شحن 25 واط للهاتف', 'يطوى للسفر'],
      en: ['Three devices at once', '25W to the phone', 'Folds flat for travel']
    },
    price: 27.9,
    colors: ['black', 'silver']
  },
  {
    id: 'core-bank',
    icon: 'powerbank',
    category: 'chargers',
    brand: 'volta',
    name: { ar: 'بطارية Core 10K', en: 'Core Bank 10K' },
    description: {
      ar: 'بطارية محمولة بسعة 10000 مللي أمبير، تشحن هاتفك مرتين كاملتين.',
      en: 'A 10,000mAh power bank that fully charges your phone twice over.'
    },
    attributes: { capacity: 10000, wattage: 20, ports: 2, connection: 'wired' },
    specs: {
      ar: ['سعة 10000mAh', 'منفذ USB-C بشحن سريع', 'حجم يدخل الجيب'],
      en: ['10,000mAh capacity', 'USB-C fast charge port', 'Pocket-sized']
    },
    price: 9.9,
    colors: ['black', 'white', 'blue']
  },
  {
    id: 'core-bank-20k',
    icon: 'powerbank',
    category: 'chargers',
    brand: 'volta',
    name: { ar: 'بطارية Core 20K', en: 'Core Bank 20K' },
    description: {
      ar: 'ضعف السعة وشحن أسرع — لرحلة طويلة أو يوم كامل بدون كهرباء.',
      en: 'Double the capacity and faster output — for a long trip or a day off-grid.'
    },
    attributes: { capacity: 20000, wattage: 45, ports: 3, connection: 'wired' },
    specs: {
      ar: ['سعة 20000mAh', 'شحن 45 واط يكفي لابتوب صغير', 'ثلاثة منافذ'],
      en: ['20,000mAh capacity', '45W — enough for a small laptop', 'Three ports']
    },
    price: 17.9,
    colors: ['black', 'silver']
  },
  {
    id: 'surge-65',
    icon: 'wallcharger',
    category: 'chargers',
    brand: 'volta',
    name: { ar: 'شاحن Surge 65', en: 'Surge 65' },
    description: {
      ar: 'شاحن جداري صغير بتقنية GaN يشحن الهاتف واللابتوب بنفس الوقت.',
      en: 'A compact GaN wall charger that runs a phone and a laptop at once.'
    },
    attributes: { wattage: 65, ports: 3, connection: 'wired' },
    specs: {
      ar: ['65 واط موزّعة بذكاء', 'منفذان USB-C ومنفذ USB-A', 'أصغر من شاحن عادي'],
      en: ['65W shared intelligently', 'Two USB-C and one USB-A', 'Smaller than a standard brick']
    },
    price: 14.9,
    colors: ['white', 'black']
  },
  {
    id: 'road-charger',
    icon: 'carcharger',
    category: 'chargers',
    brand: 'volta',
    name: { ar: 'شاحن السيارة Road', en: 'Road Car Charger' },
    description: {
      ar: 'شاحن سيارة بمنفذين، يشحن هاتفين بسرعة كاملة بنفس الوقت.',
      en: 'A two-port car charger that runs both phones at full speed.'
    },
    attributes: { wattage: 45, ports: 2, connection: 'wired' },
    specs: {
      ar: ['منفذان بشحن سريع', 'يضيء بخفة عشان تلقاه بالليل', 'يناسب كل السيارات'],
      en: ['Two fast-charge ports', 'Softly lit so you can find it at night', 'Fits any car']
    },
    price: 7.9,
    colors: ['black', 'silver']
  },

  // --- accessories ---------------------------------------------------------
  {
    id: 'nova-keys',
    icon: 'keyboard',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'لوحة مفاتيح Nova', en: 'Nova Keys' },
    description: {
      ar: 'لوحة مفاتيح ميكانيكية لاسلكية بإضاءة خلفية قابلة للتخصيص.',
      en: 'A wireless mechanical keyboard with customizable backlighting.'
    },
    attributes: { switches: 'mechanical', backlight: true, connection: 'wireless' },
    specs: {
      ar: ['مفاتيح ميكانيكية', 'اتصال لاسلكي وسلكي', 'إضاءة خلفية RGB'],
      en: ['Mechanical switches', 'Wireless + wired connection', 'RGB backlighting']
    },
    price: 29.9,
    colors: ['black', 'white']
  },
  {
    id: 'grip-stand',
    icon: 'stand',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'حامل Grip', en: 'Grip Stand' },
    description: {
      ar: 'حامل قابل للطي للهاتف واللابتوب، خفيف ويناسب السفر.',
      en: 'A foldable stand for phone and laptop — light enough to travel with.'
    },
    attributes: { foldable: true, material: 'aluminum' },
    specs: {
      ar: ['يطوى بالكامل', 'يناسب الهاتف واللابتوب', 'قاعدة ألمنيوم متينة'],
      en: ['Fully foldable', 'Fits phone and laptop', 'Durable aluminum base']
    },
    price: 6.9,
    colors: ['silver', 'black']
  },
  {
    id: 'shell-case',
    icon: 'case',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'جراب Shell', en: 'Shell Case' },
    description: {
      ar: 'جراب رفيع يحمي من السقوط بدون ما يزيد حجم الهاتف.',
      en: 'A slim case that survives drops without bulking the phone out.'
    },
    attributes: { material: 'polycarbonate', magnetic: true },
    specs: {
      ar: ['حماية من السقوط حتى مترين', 'يدعم الشحن المغناطيسي', 'حواف مرفوعة تحمي الشاشة'],
      en: ['Two-metre drop protection', 'Magnetic charging supported', 'Raised edges shield the screen']
    },
    price: 5.9,
    colors: ['black', 'navy', 'green', 'pink']
  },
  {
    id: 'link-cable',
    icon: 'cable',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'كيبل Link', en: 'Link Cable' },
    description: {
      ar: 'كيبل USB-C مجدول بطول ٢ متر، يتحمل الشد والثني.',
      en: 'A braided 2-metre USB-C cable built to survive being yanked.'
    },
    attributes: { wattage: 100, length: 2, connection: 'wired' },
    specs: {
      ar: ['يتحمل 100 واط', 'طول 2 متر', 'غلاف مجدول متين'],
      en: ['Handles 100W', '2 metres long', 'Braided, hard-wearing jacket']
    },
    price: 3.9,
    colors: ['black', 'white', 'green']
  },
  {
    id: 'snap-mount',
    icon: 'mount',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'حامل Snap المغناطيسي', en: 'Snap Magnetic Mount' },
    description: {
      ar: 'حامل مغناطيسي للسيارة، يمسك الهاتف بثبات على الطريق.',
      en: 'A magnetic car mount that holds the phone steady on a rough road.'
    },
    attributes: { magnetic: true, material: 'aluminum' },
    specs: {
      ar: ['مغناطيس قوي ثابت', 'يدور 360 درجة', 'تركيب بدون أدوات'],
      en: ['Strong, stable magnet', 'Rotates a full 360°', 'Fits with no tools']
    },
    price: 8.9,
    colors: ['black', 'silver']
  },
  {
    id: 'guard-glass',
    icon: 'glass',
    category: 'accessories',
    brand: 'volta',
    name: { ar: 'حماية شاشة Guard', en: 'Guard Screen Protector' },
    description: {
      ar: 'زجاج حماية مع إطار تركيب يخليها تنلصق مضبوطة من أول مرة.',
      en: 'Tempered glass with an alignment frame, so it lands straight the first time.'
    },
    attributes: { material: 'tempered-glass', hardness: '9H' },
    specs: {
      ar: ['صلابة 9H', 'إطار تركيب مرفق', 'طبقة مقاومة للبصمات'],
      en: ['9H hardness', 'Alignment frame included', 'Fingerprint-resistant coating']
    },
    price: 4.5,
    colors: ['silver']
  },

  // --- smart home ----------------------------------------------------------
  {
    id: 'pulse-watch',
    icon: 'watch',
    category: 'smart',
    brand: 'volta',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'ساعة Pulse', en: 'Pulse Watch' },
    description: {
      ar: 'ساعة ذكية تراقب نبضك ونومك وتتزامن مع هاتفك بسلاسة.',
      en: 'A smartwatch that tracks heart rate and sleep, synced seamlessly to your phone.'
    },
    attributes: { batteryDays: 6, display: 'AMOLED', heartRate: true, connection: 'wireless' },
    specs: {
      ar: ['مراقبة نبض القلب', 'بطارية تدوم 6 أيام', 'شاشة AMOLED'],
      en: ['Heart rate monitoring', '6-day battery life', 'AMOLED display']
    },
    price: 39.9,
    colors: ['black', 'silver', 'pink']
  },
  {
    id: 'beam-hub',
    icon: 'hub',
    category: 'smart',
    brand: 'volta',
    name: { ar: 'محور Beam', en: 'Beam Hub' },
    description: {
      ar: 'محور منزل ذكي يربط أجهزتك كلها بتطبيق واحد.',
      en: 'A smart home hub that connects all your devices in one app.'
    },
    attributes: { protocols: 'wifi-bluetooth', connection: 'wireless' },
    specs: {
      ar: ['يدعم Wi-Fi و Bluetooth', 'يتحكم بعدد غير محدود من الأجهزة', 'إعداد خلال دقيقتين'],
      en: ['Wi-Fi + Bluetooth support', 'Unlimited connected devices', '2-minute setup']
    },
    price: 18.9,
    colors: ['white', 'black']
  },
  {
    id: 'dot-tracker',
    icon: 'tracker',
    category: 'smart',
    brand: 'volta',
    name: { ar: 'متتبع Dot', en: 'Dot Tracker' },
    description: {
      ar: 'قطعة صغيرة تعلقها بالمفاتيح أو الشنطة وتلقاها من التطبيق.',
      en: 'A small tag for keys or a bag, findable from the app.'
    },
    attributes: { batteryDays: 365, connection: 'wireless' },
    specs: {
      ar: ['بطارية تدوم سنة', 'صوت تنبيه عالي', 'مقاوم للماء'],
      en: ['One-year battery', 'Loud locator chime', 'Water resistant']
    },
    price: 6.5,
    colors: ['white', 'black']
  },
  {
    id: 'flux-plug',
    icon: 'plug',
    category: 'smart',
    brand: 'volta',
    name: { ar: 'قابس Flux الذكي', en: 'Flux Smart Plug' },
    description: {
      ar: 'يحوّل أي جهاز عادي لجهاز تتحكم فيه من هاتفك.',
      en: 'Turns any ordinary appliance into one you control from your phone.'
    },
    attributes: { protocols: 'wifi', connection: 'wireless' },
    specs: {
      ar: ['جدولة تشغيل وإطفاء', 'قياس استهلاك الكهرباء', 'يشتغل بدون محور'],
      en: ['Schedule on and off', 'Tracks power usage', 'Works without a hub']
    },
    price: 5.5,
    colors: ['white']
  }
];
