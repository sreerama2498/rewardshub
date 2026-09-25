import React from "react";

// Curated dictionary of major Indian & Global consumer brands / apps with their brand assets, colors, and keywords
export const BRAND_CONFIGS = [
  // Payments / UPI / Wallets
  {
    name: "PhonePe",
    keywords: ["phonepe", "phone pe", "phonepay"],
    domain: "phonepe.com",
    badgeBg: "#5f259f",
    badgeColor: "#ffffff",
    iconText: "Pe",
    svg: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
        <rect width="24" height="24" rx="5" fill="#5F259F"/>
        <path d="M12 4v16m-4-12h7a3 3 0 0 1 0 6H8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    name: "Google Pay",
    keywords: ["google pay", "gpay", "googlepay", "tez"],
    domain: "pay.google.com",
    badgeBg: "#4285f4",
    badgeColor: "#ffffff",
    iconText: "GPay",
    svg: (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <rect width="24" height="24" rx="5" fill="#ffffff"/>
        <path fill="#4285F4" d="M18.5 12.2c0-.5-.04-1-.12-1.5H12v2.8h3.6c-.16.9-.66 1.7-1.4 2.2v1.8h2.3c1.3-1.2 2-3 2-5.3z"/>
        <path fill="#34A853" d="M12 18.8c1.8 0 3.3-.6 4.5-1.6l-2.3-1.8c-.6.4-1.4.7-2.2.7-1.7 0-3.1-1.1-3.6-2.7H6v1.9c1.1 2.2 3.4 3.5 6 3.5z"/>
        <path fill="#FBBC05" d="M8.4 13.4c-.1-.4-.2-.9-.2-1.4s.1-1 .2-1.4V8.7H6c-.5 1-1 2.1-1 3.3s.5 2.3 1 3.3l2.4-1.9z"/>
        <path fill="#EA4335" d="M12 7.7c1 0 1.9.3 2.6 1l2-2C15.3 5.5 13.8 5 12 5 9.4 5 7.1 6.3 6 8.5l2.4 1.9c.5-1.6 1.9-2.7 3.6-2.7z"/>
      </svg>
    )
  },
  {
    name: "Paytm",
    keywords: ["paytm"],
    domain: "paytm.com",
    badgeBg: "#00b9f5",
    badgeColor: "#ffffff",
    iconText: "Paytm"
  },
  {
    name: "CRED",
    keywords: ["cred"],
    domain: "cred.club",
    badgeBg: "#000000",
    badgeColor: "#ffffff",
    iconText: "CRED"
  },

  // E-commerce & Shopping
  {
    name: "Amazon",
    keywords: ["amazon", "amazon pay", "prime"],
    domain: "amazon.in",
    badgeBg: "#ff9900",
    badgeColor: "#111111",
    iconText: "Amazon"
  },
  {
    name: "Flipkart",
    keywords: ["flipkart", "supercoin"],
    domain: "flipkart.com",
    badgeBg: "#2874f0",
    badgeColor: "#ffffff",
    iconText: "Flipkart"
  },
  {
    name: "Myntra",
    keywords: ["myntra"],
    domain: "myntra.com",
    badgeBg: "#ff3f6c",
    badgeColor: "#ffffff",
    iconText: "Myntra"
  },
  {
    name: "Ajio",
    keywords: ["ajio"],
    domain: "ajio.com",
    badgeBg: "#2c4152",
    badgeColor: "#ffffff",
    iconText: "Ajio"
  },
  {
    name: "Tata Neu / Tata CLiQ",
    keywords: ["tata", "tata neu", "tatacliq", "tata cliq"],
    domain: "tatadigital.com",
    badgeBg: "#1a0b36",
    badgeColor: "#ffffff",
    iconText: "Tata"
  },
  {
    name: "Nykaa",
    keywords: ["nykaa"],
    domain: "nykaa.com",
    badgeBg: "#fc2779",
    badgeColor: "#ffffff",
    iconText: "Nykaa"
  },
  {
    name: "Meesho",
    keywords: ["meesho"],
    domain: "meesho.com",
    badgeBg: "#8a2b82",
    badgeColor: "#ffffff",
    iconText: "Meesho"
  },

  // Food, Dining & Groceries
  {
    name: "Swiggy",
    keywords: ["swiggy", "instamart", "dineout"],
    domain: "swiggy.com",
    badgeBg: "#fc8019",
    badgeColor: "#ffffff",
    iconText: "Swiggy"
  },
  {
    name: "Zomato",
    keywords: ["zomato", "blinkit", "district"],
    domain: "zomato.com",
    badgeBg: "#e23744",
    badgeColor: "#ffffff",
    iconText: "Zomato"
  },
  {
    name: "Blinkit",
    keywords: ["blinkit", "grofers"],
    domain: "blinkit.com",
    badgeBg: "#f8cb46",
    badgeColor: "#000000",
    iconText: "Blinkit"
  },
  {
    name: "Zepto",
    keywords: ["zepto"],
    domain: "zeptonow.com",
    badgeBg: "#8618e4",
    badgeColor: "#ffffff",
    iconText: "Zepto"
  },
  {
    name: "Dominos",
    keywords: ["dominos", "domino's"],
    domain: "dominos.co.in",
    badgeBg: "#006491",
    badgeColor: "#ffffff",
    iconText: "Domino's"
  },
  {
    name: "McDonald's",
    keywords: ["mcdonalds", "mcdonald's", "mcd"],
    domain: "mcdonaldsindia.com",
    badgeBg: "#ffbc0d",
    badgeColor: "#da291c",
    iconText: "McD"
  },

  // Travel, Cabs & Bus
  {
    name: "RedBus",
    keywords: ["redbus", "red bus", "redbuss"],
    domain: "redbus.in",
    badgeBg: "#d84e55",
    badgeColor: "#ffffff",
    iconText: "redBus"
  },
  {
    name: "MakeMyTrip",
    keywords: ["makemytrip", "mmt"],
    domain: "makemytrip.com",
    badgeBg: "#e42529",
    badgeColor: "#ffffff",
    iconText: "MMT"
  },
  {
    name: "Goibibo",
    keywords: ["goibibo"],
    domain: "goibibo.com",
    badgeBg: "#ec5b24",
    badgeColor: "#ffffff",
    iconText: "Goibibo"
  },
  {
    name: "Uber",
    keywords: ["uber"],
    domain: "uber.com",
    badgeBg: "#000000",
    badgeColor: "#ffffff",
    iconText: "Uber"
  },
  {
    name: "Ola",
    keywords: ["ola", "olacabs"],
    domain: "olacabs.com",
    badgeBg: "#9acd32",
    badgeColor: "#000000",
    iconText: "Ola"
  },
  {
    name: "Rapido",
    keywords: ["rapido"],
    domain: "rapido.bike",
    badgeBg: "#f9c80e",
    badgeColor: "#000000",
    iconText: "Rapido"
  },
  {
    name: "AbhiBus",
    keywords: ["abhibus"],
    domain: "abhibus.com",
    badgeBg: "#c8232c",
    badgeColor: "#ffffff",
    iconText: "AbhiBus"
  },
  {
    name: "IRCTC",
    keywords: ["irctc", "railway"],
    domain: "irctc.co.in",
    badgeBg: "#213e8a",
    badgeColor: "#ffffff",
    iconText: "IRCTC"
  },

  // Entertainment, Movies & Streaming
  {
    name: "BookMyShow",
    keywords: ["bookmyshow", "bms"],
    domain: "bookmyshow.com",
    badgeBg: "#c4242d",
    badgeColor: "#ffffff",
    iconText: "BMS"
  },
  {
    name: "Netflix",
    keywords: ["netflix"],
    domain: "netflix.com",
    badgeBg: "#e50914",
    badgeColor: "#ffffff",
    iconText: "Netflix"
  },
  {
    name: "Hotstar / Disney+",
    keywords: ["hotstar", "disney", "disney+"],
    domain: "hotstar.com",
    badgeBg: "#0f1014",
    badgeColor: "#ffffff",
    iconText: "Hotstar"
  },
  {
    name: "Spotify",
    keywords: ["spotify"],
    domain: "spotify.com",
    badgeBg: "#1db954",
    badgeColor: "#ffffff",
    iconText: "Spotify"
  },
  {
    name: "YouTube",
    keywords: ["youtube", "yt premium"],
    domain: "youtube.com",
    badgeBg: "#ff0000",
    badgeColor: "#ffffff",
    iconText: "YouTube"
  },

  // Tech, Software & Hosting
  {
    name: "Google",
    keywords: ["google", "google play", "play store", "gsuite"],
    domain: "google.com",
    badgeBg: "#4285f4",
    badgeColor: "#ffffff",
    iconText: "Google"
  },
  {
    name: "Apple",
    keywords: ["apple", "app store", "itunes"],
    domain: "apple.com",
    badgeBg: "#000000",
    badgeColor: "#ffffff",
    iconText: "Apple"
  },
  {
    name: "Microsoft",
    keywords: ["microsoft", "xbox", "azure"],
    domain: "microsoft.com",
    badgeBg: "#00a4ef",
    badgeColor: "#ffffff",
    iconText: "MS"
  },
  {
    name: "Hostinger",
    keywords: ["hostinger"],
    domain: "hostinger.com",
    badgeBg: "#673ab7",
    badgeColor: "#ffffff",
    iconText: "Hostinger"
  },

  // Pharmacy & Health
  {
    name: "PharmEasy",
    keywords: ["pharmeasy"],
    domain: "pharmeasy.in",
    badgeBg: "#10847e",
    badgeColor: "#ffffff",
    iconText: "PharmEasy"
  },
  {
    name: "1mg / Tata 1mg",
    keywords: ["1mg", "tata 1mg"],
    domain: "1mg.com",
    badgeBg: "#ff6f61",
    badgeColor: "#ffffff",
    iconText: "1mg"
  },
  {
    name: "Apollo Pharmacy",
    keywords: ["apollo", "apollo 247"],
    domain: "apollopharmacy.in",
    badgeBg: "#024a86",
    badgeColor: "#ffffff",
    iconText: "Apollo"
  },

  // Fashion, Footwear & Apparel
  {
    name: "Puma",
    keywords: ["puma"],
    domain: "in.puma.com",
    badgeBg: "#000000",
    badgeColor: "#ffffff",
    iconText: "Puma"
  },
  {
    name: "Nike",
    keywords: ["nike"],
    domain: "nike.com",
    badgeBg: "#111111",
    badgeColor: "#ffffff",
    iconText: "Nike"
  },
  {
    name: "Adidas",
    keywords: ["adidas"],
    domain: "adidas.co.in",
    badgeBg: "#000000",
    badgeColor: "#ffffff",
    iconText: "Adidas"
  }
];

/**
 * Detect brand configuration based on title, description, or source_app
 */
export function detectBrand(title = "", sourceApp = "", description = "") {
  const combined = `${title} ${sourceApp} ${description}`.toLowerCase();

  for (const brand of BRAND_CONFIGS) {
    for (const kw of brand.keywords) {
      // Check word boundary or substring match
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(combined) || combined.includes(kw)) {
        return brand;
      }
    }
  }

  // Fallback if sourceApp itself is provided
  if (sourceApp && sourceApp.trim()) {
    const cleanApp = sourceApp.trim();
    return {
      name: cleanApp,
      domain: `${cleanApp.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      badgeBg: "#495057",
      badgeColor: "#ffffff",
      iconText: cleanApp.slice(0, 3).toUpperCase()
    };
  }

  return null;
}
