/**
 * Comprehensive Coupon Taxonomy & Knowledge Base
 * Defines user-friendly names, examples, guidelines, and smart brand auto-detection.
 */

export const COUPON_TYPES_GUIDE = [
  {
    id: "FLAT_AMOUNT",
    friendlyName: "Fixed Rupee Discount",
    technicalName: "Flat Amount",
    icon: "💵",
    tagline: "Direct cash deduction off your final bill",
    explanation: "You get a specific, fixed amount deducted from your total checkout price, regardless of percentages.",
    example: "Flat ₹150 OFF on orders above ₹499",
    bestFor: "Food deliveries, ride bookings, minimum cart value orders",
    requiredFields: "Discount Amount (₹), Min Cart Spend (₹)"
  },
  {
    id: "PERCENTAGE",
    friendlyName: "Percentage Discount",
    technicalName: "Percentage Off",
    icon: "🏷️",
    tagline: "Percentage off total bill, usually with a maximum cap",
    explanation: "Reduces your bill by a fixed percentage. Usually includes a maximum savings limit (cap) and minimum spend.",
    example: "30% OFF up to ₹150 on Myntra Fashion",
    bestFor: "Fashion shopping, seasonal sales, large retail orders",
    requiredFields: "Percentage (%), Max Cap (₹), Min Cart Spend (₹)"
  },
  {
    id: "BOGO",
    friendlyName: "Buy-One-Get-One (BOGO)",
    technicalName: "BOGO",
    icon: "🎁",
    tagline: "Get a 2nd product or ticket completely free",
    explanation: "Buy one eligible product or ticket and receive a second identical or companion item at zero cost.",
    example: "Buy 1 Medium Pizza Get 1 Free at Domino's",
    bestFor: "Pizzas, movies, dining, coffee shops, footwear",
    requiredFields: "BOGO Terms / Product Details, Estimated Value"
  },
  {
    id: "FREE_SHIPPING",
    friendlyName: "Free Delivery / Shipping",
    technicalName: "Free Shipping",
    icon: "🚚",
    tagline: "Zero delivery, courier, or handling fee",
    explanation: "Eliminates all shipping, handling, or distance surge delivery charges on your order.",
    example: "Free Delivery on Blinkit on orders above ₹199",
    bestFor: "Quick grocery apps, e-commerce stores, courier shipments",
    requiredFields: "Delivery Value Saved (₹), Min Order Value (₹)"
  },
  {
    id: "FREE_GIFT",
    friendlyName: "Free Gift / Sample",
    technicalName: "Free Gift",
    icon: "✨",
    tagline: "Complimentary item or sample included with order",
    explanation: "An extra physical product, starter kit, or sample is added to your package without any additional cost.",
    example: "Free Skincare Travel Kit on Nykaa orders ₹999+",
    bestFor: "Cosmetics, beauty, restaurant combos, electronics bundles",
    requiredFields: "Gift Item Description, Estimated Gift Value (₹)"
  },
  {
    id: "TIERED",
    friendlyName: "Spend More, Save More",
    technicalName: "Tiered Threshold",
    icon: "📊",
    tagline: "Discounts increase as cart value crosses slabs",
    explanation: "Multi-level milestone savings. The more items or rupee value you add to your cart, the higher your discount.",
    example: "Spend ₹1000 save ₹100; Spend ₹2500 save ₹300; Spend ₹5000 save ₹800",
    bestFor: "Apparel megastores, department stores, festive sales",
    requiredFields: "Slab Breakdown Details, Highest Tier Value"
  },
  {
    id: "GIFT_CARD",
    friendlyName: "Prepaid Gift Card & PIN",
    technicalName: "Gift Card",
    icon: "💳",
    tagline: "Stored digital currency balance with security PIN",
    explanation: "Acts exactly like digital cash. Added to your brand wallet balance and redeemed 100% against any purchases.",
    example: "Amazon Pay / Flipkart ₹500 Gift Voucher with 6-digit PIN",
    bestFor: "Amazon, Flipkart, Google Play, Croma, Brand Vouchers",
    requiredFields: "Voucher Code, Secret PIN, Full Balance Amount (₹)"
  },
  {
    id: "CASHBACK",
    friendlyName: "Wallet Cashback Voucher",
    technicalName: "Cashback",
    icon: "🪙",
    tagline: "Money credited back into your wallet or UPI after order",
    explanation: "You pay full price at checkout, and the cash reward is refunded or credited into your wallet shortly after.",
    example: "₹150 Cashback on CRED or Google Pay Scratch Card",
    bestFor: "Fintech apps, UPI payments, credit card rewards",
    requiredFields: "Cashback Amount (₹), Min Transaction Spend (₹)"
  },
  {
    id: "SUBSCRIPTION_PASS",
    friendlyName: "Free Membership / OTT Pass",
    technicalName: "Subscription Pass",
    icon: "⭐",
    tagline: "Free months of premium services or trial memberships",
    explanation: "Unlocks premium, ad-free, or VIP access to streaming apps, learning portals, or club memberships for a period.",
    example: "3 Months Spotify Premium Free or 1 Year Times Prime",
    bestFor: "Spotify, Netflix, YouTube Premium, Disney+ Hotstar, CultPass",
    requiredFields: "Subscription Period (e.g. 3 Months), Market Worth (₹)"
  },
  {
    id: "RECHARGE_BILL",
    friendlyName: "Recharge & Utility Bill Rebate",
    technicalName: "Recharge & Bill Pay",
    icon: "⚡",
    tagline: "Discount on mobile recharge, FASTag, or utility bills",
    explanation: "Instant discount or cashback specifically applied when paying electricity, water, gas, broadband, or mobile bills.",
    example: "Flat ₹25 OFF on Electricity Bill via PhonePe",
    bestFor: "PhonePe, Paytm, GooglePay, Airtel Thanks, Vi App",
    requiredFields: "Bill Rebate Amount (₹), Min Bill Amount (₹)"
  }
];

export const CATEGORIES_GUIDE = [
  {
    id: "FOOD",
    friendlyName: "Food & Dining",
    icon: "🍔",
    description: "Online food ordering, restaurants, cafe dining, and cloud kitchens",
    popularBrands: ["Swiggy", "Zomato", "Domino's", "McDonald's", "Pizza Hut", "KFC", "Subway", "Behrouz"],
    sampleOffers: "Flat ₹125 OFF, Buy 1 Get 1 Pizzas, Free Choco Lava Cake"
  },
  {
    id: "FASHION",
    friendlyName: "Fashion & Shopping",
    icon: "🛍️",
    description: "Apparel, footwear, accessories, cosmetics, and department store fashion",
    popularBrands: ["Myntra", "Ajio", "Flipkart", "Nykaa", "Tata CLiQ", "Zara", "H&M", "Decathlon"],
    sampleOffers: "30% OFF up to ₹300, End of Season clearance vouchers, ₹500 off on ₹2499"
  },
  {
    id: "GROCERY",
    friendlyName: "Grocery & Quick Commerce",
    icon: "🛒",
    description: "10-minute instant delivery, supermarkets, and daily household essentials",
    popularBrands: ["Blinkit", "Zepto", "Swiggy Instamart", "BigBasket", "BB Daily", "Dunzo", "Nature's Basket"],
    sampleOffers: "Free Delivery over ₹199, ₹75 OFF on daily vegetables, 20% off dairy"
  },
  {
    id: "TRAVEL",
    friendlyName: "Travel & Commute",
    icon: "✈️",
    description: "Cab bookings, flight tickets, train passes, bus rides, and hotel bookings",
    popularBrands: ["Uber", "Ola", "Rapido", "MakeMyTrip", "Cleartrip", "Goibibo", "RedBus", "EaseMyTrip"],
    sampleOffers: "Flat ₹50 OFF on 5 Uber rides, ₹1200 OFF on Domestic Flights"
  },
  {
    id: "ENTERTAINMENT",
    friendlyName: "OTT & Entertainment",
    icon: "🎬",
    description: "Cinema tickets, music streaming apps, video OTT platforms, and live events",
    popularBrands: ["BookMyShow", "Spotify", "Netflix", "Disney+ Hotstar", "Prime Video", "SonyLIV", "Gaana"],
    sampleOffers: "Buy 1 Get 1 Movie Ticket, 3 Months Free Spotify Premium, ₹100 off on IMAX"
  },
  {
    id: "HEALTH",
    friendlyName: "Health & Wellness",
    icon: "💊",
    description: "Online pharmacies, doctor consultations, lab tests, gym and fitness passes",
    popularBrands: ["Apollo 24/7", "PharmEasy", "Tata 1mg", "Cult.fit", "HealthKart", "Netmeds"],
    sampleOffers: "25% OFF on Prescription Medicines, ₹200 OFF on Full Body Checkup"
  },
  {
    id: "GAMING",
    friendlyName: "Gaming & Digital",
    icon: "🎮",
    description: "In-game currency, console stores, PC games, gift cards, and gaming passes",
    popularBrands: ["Steam", "PlayStation Store", "Xbox", "BGMI", "Google Play Store", "Riot Games", "Discord"],
    sampleOffers: "Google Play ₹100 discount coupon, BGMI 600 UC bonus code"
  },
  {
    id: "EDTECH",
    friendlyName: "EdTech & Courses",
    icon: "🎓",
    description: "Online course certifications, professional skills, tech tutorials, and test prep",
    popularBrands: ["Coursera", "Udemy", "Unacademy", "Simplilearn", "edX", "UpGrad", "Skillshare"],
    sampleOffers: "80% OFF on Top Udemy Courses, 1 Month Free Coursera Plus access"
  },
  {
    id: "FINTECH",
    friendlyName: "Fintech, Bills & Recharge",
    icon: "💳",
    description: "UPI cashback, credit card bill payments, mobile recharge, and utility bills",
    popularBrands: ["PhonePe", "CRED", "GooglePay", "Paytm", "Mobikwik", "Freecharge", "Amazon Pay"],
    sampleOffers: "Flat ₹25 OFF on Electricity Bill, ₹150 Cashback on Credit Card Payment"
  },
  {
    id: "OTHER",
    friendlyName: "Other Offers",
    icon: "🏷️",
    description: "Specialized utilities, home services, hardware, electronics, and multi-brand perks",
    popularBrands: ["Urban Company", "IKEA", "Croma", "Reliance Digital", "Lenskart", "Pepperfry"],
    sampleOffers: "Flat ₹200 OFF on Home Deep Cleaning, 15% OFF on Eyeglasses"
  }
];

// Brand to Category Mapping Dictionary for instant auto-detection
const BRAND_CATEGORY_MAP = {
  // Food
  swiggy: "FOOD",
  zomato: "FOOD",
  dominos: "FOOD",
  domino: "FOOD",
  "pizza hut": "FOOD",
  mcdonalds: "FOOD",
  mcdonald: "FOOD",
  kfc: "FOOD",
  subway: "FOOD",
  burgerking: "FOOD",
  "burger king": "FOOD",
  behrouz: "FOOD",
  faasos: "FOOD",
  starbucks: "FOOD",
  barbeque: "FOOD",

  // Fashion
  myntra: "FASHION",
  ajio: "FASHION",
  nykaa: "FASHION",
  zara: "FASHION",
  "h&m": "FASHION",
  hm: "FASHION",
  decathlon: "FASHION",
  tatacliq: "FASHION",
  "tata cliq": "FASHION",
  shoppersstop: "FASHION",
  "marks & spencer": "FASHION",
  max: "FASHION",
  pantaloons: "FASHION",
  bewakoof: "FASHION",
  snitch: "FASHION",
  lenskart: "FASHION",

  // Grocery
  blinkit: "GROCERY",
  zepto: "GROCERY",
  instamart: "GROCERY",
  bigbasket: "GROCERY",
  "bb daily": "GROCERY",
  dunzo: "GROCERY",
  dmart: "GROCERY",

  // Travel
  uber: "TRAVEL",
  ola: "TRAVEL",
  rapido: "TRAVEL",
  makemytrip: "TRAVEL",
  mmt: "TRAVEL",
  cleartrip: "TRAVEL",
  goibibo: "TRAVEL",
  redbus: "TRAVEL",
  easemytrip: "TRAVEL",
  irctc: "TRAVEL",
  yatra: "TRAVEL",
  indigo: "TRAVEL",
  airindia: "TRAVEL",

  // Entertainment
  bookmyshow: "ENTERTAINMENT",
  bms: "ENTERTAINMENT",
  spotify: "ENTERTAINMENT",
  netflix: "ENTERTAINMENT",
  hotstar: "ENTERTAINMENT",
  "disney+": "ENTERTAINMENT",
  "prime video": "ENTERTAINMENT",
  sonyliv: "ENTERTAINMENT",
  zee5: "ENTERTAINMENT",
  gaana: "ENTERTAINMENT",
  wynk: "ENTERTAINMENT",
  youtube: "ENTERTAINMENT",
  pvr: "ENTERTAINMENT",
  inox: "ENTERTAINMENT",

  // Health
  apollo: "HEALTH",
  pharmeasy: "HEALTH",
  "1mg": "HEALTH",
  tata1mg: "HEALTH",
  cult: "HEALTH",
  "cult.fit": "HEALTH",
  cultfit: "HEALTH",
  netmeds: "HEALTH",
  healthkart: "HEALTH",
  practo: "HEALTH",

  // Gaming
  steam: "GAMING",
  playstation: "GAMING",
  psn: "GAMING",
  xbox: "GAMING",
  bgmi: "GAMING",
  roblox: "GAMING",
  riot: "GAMING",
  discord: "GAMING",
  "google play": "GAMING",

  // EdTech
  coursera: "EDTECH",
  udemy: "EDTECH",
  unacademy: "EDTECH",
  simplilearn: "EDTECH",
  edx: "EDTECH",
  upgrad: "EDTECH",
  skillshare: "EDTECH",
  duolingo: "EDTECH",

  // Fintech
  phonepe: "FINTECH",
  cred: "FINTECH",
  gpay: "FINTECH",
  "google pay": "FINTECH",
  paytm: "FINTECH",
  mobikwik: "FINTECH",
  freecharge: "FINTECH",
  navi: "FINTECH",
  jupiter: "FINTECH",
  fi: "FINTECH"
};

/**
 * Automatically detects the best category from brand name
 */
export function detectCategoryFromBrand(brand) {
  if (!brand || typeof brand !== "string") return null;
  const clean = brand.trim().toLowerCase();
  for (const [key, category] of Object.entries(BRAND_CATEGORY_MAP)) {
    if (clean === key || clean.includes(key)) {
      return category;
    }
  }
  return null;
}

/**
 * Smart detection of discount mechanism based on text keywords
 */
export function detectMechanismFromText(text) {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();

  // BOGO check
  if (lower.includes("buy 1 get 1") || lower.includes("bogo") || lower.includes("buy one get one") || lower.includes("2 for 1")) {
    return "BOGO";
  }

  // Free shipping check
  if (lower.includes("free shipping") || lower.includes("free delivery") || lower.includes("zero delivery") || lower.includes("no delivery fee")) {
    return "FREE_SHIPPING";
  }

  // Gift card check
  if (lower.includes("gift card") || lower.includes("gift voucher") || lower.includes("pin") || lower.includes("stored value")) {
    return "GIFT_CARD";
  }

  // Subscription pass check
  if (lower.includes("subscription") || lower.includes("premium pass") || lower.includes("month free") || lower.includes("months free") || lower.includes("trial pass") || lower.includes("year free")) {
    return "SUBSCRIPTION_PASS";
  }

  // Cashback check
  if (lower.includes("cashback") || lower.includes("cash back") || lower.includes("wallet credit")) {
    return "CASHBACK";
  }

  // Recharge / Bill check
  if (lower.includes("recharge") || lower.includes("electricity") || lower.includes("fastag") || lower.includes("utility") || lower.includes("dth") || lower.includes("water bill")) {
    return "RECHARGE_BILL";
  }

  // Free gift check
  if (lower.includes("free gift") || lower.includes("complimentary") || lower.includes("free sample") || lower.includes("free kit")) {
    return "FREE_GIFT";
  }

  // Tiered check
  if (lower.includes("spend") && (lower.includes("save") || lower.includes("get")) && lower.includes(";")) {
    return "TIERED";
  }

  // Percentage check
  if (lower.includes("%") || lower.includes("percent")) {
    return "PERCENTAGE";
  }

  // Flat amount check
  if (lower.includes("flat") || lower.includes("₹") || lower.includes("rs") || lower.includes("off")) {
    return "FLAT_AMOUNT";
  }

  return null;
}
