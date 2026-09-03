export const copy = {
  ar: {
    brand: 'فولتا',
    tagline: 'اشحن طاقتك',
    nav: {
      home: 'الرئيسية',
      products: 'المنتجات',
      searchPlaceholder: 'ابحث عن منتج...',
      cart: 'السلة',
      wishlist: 'المفضلة',
      menu: 'القائمة',
      seeAllResults: 'عرض كل النتائج',
      langSwitch: 'English'
    },
    hero: {
      eyebrow: 'اشحن طاقتك',
      title: 'تقنية تلمع بقدر ما تشتغل.',
      subtitle: 'هواتف مختارة بعناية، بكل الألوان والسعات — وبأسعار واضحة من أول نظرة.',
      cta: 'تسوق الهواتف',
      secondaryCta: 'استكشف كل المنتجات'
    },
    spotlight: {
      // "الأضواء" was a literal rendering of "Spotlight" — it means "the lights"
      // and reads as machine translation. "الأبرز" (the standout) is what an
      // Arabic editor would actually label this section, and it stays distinct
      // from "منتجات مختارة" used by the featured grid below it.
      label: 'الأبرز',
      cta: 'اعرف أكثر'
    },
    bento: {
      title: 'ليش تشتري من فولتا؟',
      speed: {
        title: 'يفتح فورًا',
        body: 'الموقع كامل أخف من صورة وحدة. بدون انتظار، بدون شاشة بيضاء.'
      },
      arabic: {
        title: 'عربي من الأساس',
        body: 'مو ترجمة متأخرة — التصميم كله مبني من اليمين لليسار، والإنجليزي خيار.'
      },
      colors: {
        title: 'كل لون بصفحة وحدة',
        body: 'الهاتف يظهر مرة وحدة، وتختار لونه وسعته منه — بدون ما تدور بين نسخ مكررة.'
      },
      warranty: {
        title: 'ضمان سنة كاملة',
        body: 'على كل جهاز، بدون شروط معقدة وبدون أسئلة.'
      }
    },
    closing: {
      title: 'جاهز تبدأ؟',
      subtitle: 'أسرع طريقة تشتري هاتفك الجديد في الكويت.',
      cta: 'تصفح الهواتف'
    },
    categories: {
      title: 'تسوق حسب الفئة',
      phones: 'هواتف',
      chargers: 'شواحن',
      audio: 'صوتيات',
      accessories: 'إكسسوارات',
      smart: 'المنزل الذكي'
    },
    facets: {
      title: 'تصفية',
      clear: 'مسح الكل',
      // Arabic distinguishes six plural categories; Intl.PluralRules picks one.
      results: {
        zero: 'نتائج',
        one: 'نتيجة واحدة',
        two: 'نتيجتان',
        few: 'نتائج',
        many: 'نتيجة',
        other: 'نتيجة'
      },
      brand: 'الماركة',
      storage: 'السعة',
      color: 'اللون',
      screen: 'حجم الشاشة',
      price: 'السعر',
      screens: {
        compact: 'أقل من 6.4 بوصة',
        standard: '6.4 – 6.8 بوصة',
        large: 'أكبر من 6.8 بوصة'
      },
      values: {}
    },
    featured: {
      title: 'منتجات مختارة',
      viewAll: 'عرض الكل'
    },
    trust: {
      title: 'ليش فولتا؟',
      items: [
        { title: 'اختيار مدروس', body: 'كل قطعة تدخل الموقع تنفحص قبل لا توصلك.' },
        { title: 'ضمان حقيقي', body: 'ضمان سنة كامل على كل منتج، بدون شروط معقدة.' },
        { title: 'شحن سريع', body: 'يوصلك طلبك خلال يومين داخل المدينة.' }
      ]
    },
    product: {
      addToCart: 'أضف إلى السلة',
      outOfStock: 'غير متوفر حاليًا',
      specs: 'المواصفات',
      related: 'قد يعجبك أيضًا',
      quantity: 'الكمية',
      inStock: 'متوفر',
      lowStock: 'كمية محدودة',
      storage: 'السعة',
      from: 'يبدأ من',
      companions: 'كمّل عدّتك',
      backToProducts: 'رجوع للمنتجات'
    },
    filters: {
      all: 'الكل',
      sortLabel: 'ترتيب حسب',
      priceLowHigh: 'السعر: من الأقل للأعلى',
      priceHighLow: 'السعر: من الأعلى للأقل',
      newest: 'الأحدث',
      loadMore: 'عرض المزيد'
    },
    cart: {
      title: 'سلة التسوق',
      empty: 'سلتك فارغة — خلها ما تضل فاضية.',
      browse: 'تصفح المنتجات',
      subtotal: 'المجموع الفرعي',
      shipping: 'الشحن',
      free: 'مجاني',
      total: 'الإجمالي',
      checkout: 'إتمام الشراء',
      remove: 'إزالة',
      continueShopping: 'متابعة التسوق'
    },
    checkout: {
      title: 'الدفع',
      shippingInfo: 'معلومات الشحن',
      fullName: 'الاسم الكامل',
      address: 'العنوان',
      city: 'المدينة',
      phone: 'رقم الهاتف',
      payment: 'طريقة الدفع',
      cardNumber: 'رقم البطاقة',
      expiry: 'تاريخ الانتهاء',
      cvc: 'CVC',
      placeOrder: 'تأكيد الطلب',
      orderSummary: 'ملخص الطلب',
      demoNotice: 'هذا نموذج تجريبي — ما راح يتم أي عملية دفع حقيقية.'
    },
    confirmation: {
      title: 'تم الطلب بنجاح!',
      message: 'شكرًا لك — طلبك رقم',
      onTheWay: 'في الطريق إليك.',
      continue: 'متابعة التسوق'
    },
    wishlist: {
      empty: 'قائمة المفضلة فارغة — خلّها ما تضل فاضية.'
    },
    misc: {
      addedToast: 'تمت الإضافة ⚡',
      favoritedToast: 'أُضيف للمفضلة',
      noResults: 'ما لقينا نتائج — جرّب كلمة ثانية.',
      close: 'إغلاق',
      priceMin: 'أقل سعر',
      priceMax: 'أعلى سعر',
      themeToDark: 'الوضع الداكن',
      themeToLight: 'الوضع الفاتح'
    },
    errors: {
      required: 'هذي الخانة مطلوبة',
      phone: 'رقم الهاتف لازم يكون ٨ أرقام على الأقل',
      cardNumber: 'رقم البطاقة لازم يكون ١٦ رقم',
      expiry: 'استخدم تاريخ صالح وغير منتهي بصيغة شهر/سنة',
      cvc: 'الرمز لازم يكون ٣ أرقام'
    },
    notFound: {
      title: 'ما لقينا الصفحة',
      message: 'الرابط غلط أو الصفحة انحذفت. تقدر ترجع للهواتف أو للرئيسية.',
      browse: 'تصفح الهواتف',
      home: 'الرئيسية'
    },
    footer: {
      rights: 'جميع الحقوق محفوظة',
      demo: 'مشروع تجريبي بواجهة React — بدون خادم أو معالجة دفع حقيقية.'
    }
  },
  en: {
    brand: 'VOLTA',
    tagline: 'Power Up',
    nav: {
      home: 'Home',
      products: 'Products',
      searchPlaceholder: 'Search products...',
      cart: 'Cart',
      wishlist: 'Wishlist',
      menu: 'Menu',
      seeAllResults: 'See all results',
      langSwitch: 'العربية'
    },
    hero: {
      eyebrow: 'Power Up',
      title: 'Tech that glows as hard as it works.',
      subtitle: 'Carefully chosen phones — every colour, every size, every price in plain sight.',
      cta: 'Shop Phones',
      secondaryCta: 'Explore Everything'
    },
    spotlight: {
      label: 'Spotlight',
      cta: 'Learn more'
    },
    bento: {
      title: 'Why buy from VOLTA?',
      speed: {
        title: 'Opens instantly',
        body: 'The entire site weighs less than a single photograph. No waiting, no white screen.'
      },
      arabic: {
        title: 'Arabic by default',
        body: 'Not a bolted-on translation — the layout is built right-to-left first, and English is the option.'
      },
      colors: {
        title: 'One phone, one page',
        body: 'Pick the colour and the size on the product itself, instead of hunting through duplicate listings.'
      },
      warranty: {
        title: 'A full year of warranty',
        body: 'On every device. No complicated conditions, no questions.'
      }
    },
    closing: {
      title: 'Ready when you are.',
      subtitle: 'The fastest way to buy your next phone in Kuwait.',
      cta: 'Browse phones'
    },
    categories: {
      title: 'Shop by Category',
      phones: 'Phones',
      chargers: 'Chargers',
      audio: 'Audio',
      accessories: 'Accessories',
      smart: 'Smart Home'
    },
    facets: {
      title: 'Filter',
      clear: 'Clear all',
      results: { one: 'result', other: 'results' },
      brand: 'Brand',
      storage: 'Storage',
      color: 'Colour',
      screen: 'Screen size',
      price: 'Price',
      screens: {
        compact: 'Under 6.4 inch',
        standard: '6.4 – 6.8 inch',
        large: 'Over 6.8 inch'
      },
      values: {}
    },
    featured: {
      title: 'Featured Products',
      viewAll: 'View All'
    },
    trust: {
      title: 'Why VOLTA?',
      items: [
        { title: 'Curated, not crammed', body: 'Every piece is vetted before it ever reaches the site.' },
        { title: 'Real warranty', body: 'A full year on every product, no fine print.' },
        { title: 'Fast shipping', body: 'In-city delivery within two days.' }
      ]
    },
    product: {
      addToCart: 'Add to Cart',
      outOfStock: 'Currently unavailable',
      specs: 'Specs',
      related: 'You might also like',
      quantity: 'Quantity',
      inStock: 'In stock',
      lowStock: 'Only a few left',
      storage: 'Storage',
      from: 'From',
      companions: 'Complete your setup',
      backToProducts: 'Back to Products'
    },
    filters: {
      all: 'All',
      sortLabel: 'Sort by',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
      newest: 'Newest',
      loadMore: 'Show more'
    },
    cart: {
      title: 'Your Cart',
      empty: "Your cart's empty — let's fix that.",
      browse: 'Browse Products',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      free: 'Free',
      total: 'Total',
      checkout: 'Checkout',
      remove: 'Remove',
      continueShopping: 'Continue Shopping'
    },
    checkout: {
      title: 'Checkout',
      shippingInfo: 'Shipping Information',
      fullName: 'Full Name',
      address: 'Address',
      city: 'City',
      phone: 'Phone Number',
      payment: 'Payment Method',
      cardNumber: 'Card Number',
      expiry: 'Expiry',
      cvc: 'CVC',
      placeOrder: 'Place Order',
      orderSummary: 'Order Summary',
      demoNotice: 'This is a demo form — no real payment will be processed.'
    },
    confirmation: {
      title: 'Order Confirmed!',
      message: 'Thank you — your order',
      onTheWay: 'is on its way.',
      continue: 'Continue Shopping'
    },
    wishlist: {
      empty: "Your wishlist's empty — let's fix that."
    },
    misc: {
      addedToast: 'Added to cart ⚡',
      favoritedToast: 'Added to wishlist',
      noResults: "No results — try a different search.",
      close: 'Close',
      priceMin: 'Minimum price',
      priceMax: 'Maximum price',
      themeToDark: 'Switch to dark mode',
      themeToLight: 'Switch to light mode'
    },
    errors: {
      required: 'This field is required',
      phone: 'Phone number needs at least 8 digits',
      cardNumber: 'Card number should be 16 digits',
      expiry: 'Use a valid, unexpired MM/YY',
      cvc: 'CVC should be 3 digits'
    },
    notFound: {
      title: 'We could not find that page',
      message: 'The link may be wrong, or the page may have moved. Head back to the phones or to the homepage.',
      browse: 'Browse phones',
      home: 'Home'
    },
    footer: {
      rights: 'All rights reserved',
      demo: 'A React front-end demo — no server or real payment processing.'
    }
  }
};
