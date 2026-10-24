/**
 * Ladakh Wayfarers — Default Seed Data Module
 * =========================================================================
 * This module defines the authoritative baseline datasets for Ladakh Wayfarers.
 * 
 * WHEN IS THIS USED?
 * 1. Automatic Database Seeding: When MongoDB is connected for the first time
 *    and collections are empty, server.js automatically seeds these datasets.
 * 2. In-Memory / Local Cache Fallback: When MongoDB is unreachable, server.js
 *    initializes its runtime memory store with these exact items.
 * 3. Manual Reset: When an administrator clicks "Seed / Reset Sample Data" in
 *    the Admin UI or sends a POST request to /api/seed.
 * 
 * HOW TO ADD / MODIFY DEFAULT DATA IN THE FUTURE:
 * - INITIAL_TOURS: Add new tour objects with unique `id`, itinerary days, and highlights.
 * - INITIAL_REVIEWS: Add verified traveler testimonials.
 * - INITIAL_GALLERY: Add photo or video objects (supports Cloudinary publicId or direct URLs).
 * - INITIAL_DRIVER_CONFIG: Update chauffeur profile, union registration, phone, and safety checklist.
 * =========================================================================
 */

// Initial Tour Packages (Tours CRUD)
const INITIAL_TOURS = [
  {
    id: "tour-5-days-leh",
    title: "5 Days Classic Leh & Sham Valley Explorer",
    duration: "5 Days / 4 Nights",
    maxAltitude: "17,982 ft (Khardung La)",
    difficulty: "Easy",
    bestSeason: "May to October (Available Year-Round)",
    idealVehicle: "Toyota Innova Crysta",
    category: "Classic",
    badge: "Family Favorite",
    priceEstimate: "₹18,500 - ₹24,000",
    overview: "A leisurely mountain journey designed for effortless acclimatization. Covers historical palaces, ancient Tibetan monasteries, the gravity-defying Magnetic Hill, and an exhilarating ride to Khardung La.",
    highlights: [
      "Acclimatization day with Shanti Stupa sunset & Leh Palace",
      "Hall of Fame War Memorial & Gurudwara Pathar Sahib",
      "Magnetic Hill & Sangam (Indus and Zanskar rivers confluence)",
      "Ascend to Khardung La Pass (17,982 ft) snow panoramic ridge",
      "Thiksey Monastery (Mini Potala) & Shey Palace",
      "Relaxed pacing with medical oxygen monitoring"
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Arrival in Leh (3,500m) & Sacred Acclimatization",
        desc: "Airport pickup with traditional Ladakhi Khatag blessing. Transfer to your hotel for mandatory complete rest to acclimatize. Evening gentle walk in Leh Bazaar and sunset at Shanti Stupa."
      },
      {
        day: "Day 2",
        title: "Sham Valley Cultural & Geological Wonders",
        desc: "Scenic drive along the Indus River. Test gravity at Magnetic Hill, visit Gurudwara Pathar Sahib, and watch the confluence of Indus and Zanskar rivers at Nimmu."
      },
      {
        day: "Day 3",
        title: "Summiting Khardung La Pass (17,982 ft)",
        desc: "Morning ascent up the legendary switchbacks to Khardung La. Sip butter tea and enjoy mountain views before returning to visit the 12-storey Thiksey Monastery."
      },
      {
        day: "Day 4",
        title: "Indus Valley Monasteries & Sindhu Ghat",
        desc: "Explore Hemis Gompa nestled in a sacred gorge, Stok Palace royal museum, and peaceful reflection at Sindhu Ghat."
      },
      {
        day: "Day 5",
        title: "Airport Farewell",
        desc: "Timely airport transfer with warm mountain wishes and blessings."
      }
    ]
  },
  {
    id: "tour-6-days-nubra-pangong",
    title: "6-7 Days Nubra Valley & Pangong Lake Circuit",
    duration: "7 Days / 6 Nights",
    maxAltitude: "17,982 ft (Khardung La) & 17,590 ft (Chang La)",
    difficulty: "Moderate",
    bestSeason: "May to October",
    idealVehicle: "Toyota Innova Crysta",
    category: "Classic",
    badge: "Bestseller",
    priceEstimate: "₹28,000 - ₹36,000",
    overview: "Ladakh's most famous circuit. Traverse high mountain passes, ride double-humped camels among desert dunes in Nubra, explore the Indo-Pak border village of Turtuk, and sleep beneath millions of stars along turquoise Pangong Tso.",
    highlights: [
      "Drive across Khardung La (17,982 ft)",
      "Giant 108-ft Maitreya Buddha statue at Diskit Gompa",
      "Bactrian Camel safari on Hunder White Sand Dunes",
      "Excursion to Turtuk (historic Baltistan heritage village)",
      "Adventurous off-road Shayok River route direct to Pangong",
      "Overnight lakeside stargazing at Pangong Lake (14,270 ft)",
      "Return over Chang La Pass (17,590 ft)"
    ],
    itinerary: [
      {
        day: "Day 1",
        title: "Leh Arrival & Acclimatization",
        desc: "Airport transfer, complete hydration and rest. Evening stroll at Shanti Stupa."
      },
      {
        day: "Day 2",
        title: "Leh to Nubra Valley via Khardung La",
        desc: "Climb the world's most iconic pass and descend into the fertile valleys of Nubra. Visit Diskit Monastery and sunset camel safari at Hunder dunes."
      },
      {
        day: "Day 3",
        title: "Turtuk Village & Balti Cultural Excursion",
        desc: "Drive alongside the Shyok river to Turtuk on the border of Baltistan. Taste organic apricots and visit the old royal residence."
      },
      {
        day: "Day 4",
        title: "Nubra to Pangong Tso via Shyok River Canyon",
        desc: "Direct scenic wilderness drive along the riverbed to the shimmering turquoise waters of Pangong Tso Lake."
      },
      {
        day: "Day 5",
        title: "Pangong Sunrise & Return via Chang La",
        desc: "Watch morning light dance over the lake. Ascend Chang La Pass and return to Leh with a stop at Thiksey Monastery."
      },
      {
        day: "Day 6",
        title: "Sham Valley Sightseeing & Souvenirs",
        desc: "Visit Sangam, Magnetic Hill, and shop for authentic Pashmina shawls in Leh."
      },
      {
        day: "Day 7",
        title: "Departure Transfer",
        desc: "Drop off at Leh airport."
      }
    ]
  }
];

const INITIAL_REVIEWS = [
  {
    id: "rev_01",
    name: "Ananya & Rahul Sharma",
    email: "ananya.sharma@gmail.com",
    origin: "Mumbai, Maharashtra",
    rating: 5,
    date: "2026-08-14",
    route: "7 Days Nubra, Pangong & Hanle Circuit",
    vehicle: "Toyota Innova Crysta",
    review: "Stanzin bhai is not just a driver; he was our guardian angel in Ladakh! Traveling with my 62-year-old mother who got mild altitude headache at Khardung La, Stanzin immediately provided the on-board oxygen cylinder and safely drove us to the lower elevation of Nubra. His car was spotless, driving was remarkably smooth on hairpin bends, and he knows every scenic photography spot. 100% recommended for families!",
    verified: true,
    helpfulCount: 42,
    driverReply: "Julley Ananya ji! It was an absolute pleasure hosting you and aunty. Hope aunty is in prime health! Warm wishes from Leh."
  },
  {
    id: "rev_02",
    name: "Markus & Elena Schneider",
    email: "markus.schneider.photo@web.de",
    origin: "Munich, Germany",
    rating: 5,
    date: "2026-07-28",
    route: "Umling La (19,024 ft) & Tso Moriri",
    vehicle: "Toyota Innova Crysta",
    review: "As a landscape photographer, reaching Umling La (world's highest motorable pass at 19,024 ft) was my lifetime dream. Stanzin's vehicle handled the gravel and steep gradients effortlessly. He knows exact golden hour timings, where to spot Himalayan marmots, and drove safely through icy patches without any rush. His monastery insights made this trip unforgettable.",
    verified: true,
    helpfulCount: 38,
    driverReply: "Julley Markus! Your photos of Tso Moriri were breathtaking. Come back in winter for the snow leopard expedition!"
  }
];

const INITIAL_GALLERY = [
  {
    id: "gal-innova-selfie",
    title: "Expedition Moments inside Toyota Innova Crysta",
    category: "vehicles",
    caption: "Comfortable high-altitude mountain travel with guests enjoying the scenic journey across Ladakh switchbacks.",
    location: "Leh - Nubra Valley Circuit",
    image: "https://res.cloudinary.com/efv1qjok/image/upload/v1792467736/ladakh_wayfarers/innova_travelers_selfie.jpg",
    publicId: "ladakh_wayfarers/innova_travelers_selfie",
    mediaType: "image"
  },
  {
    id: "gal-pangong-guests",
    title: "Pristine Lake Views & Smiles with Stanzin Jigmet",
    category: "lakes",
    caption: "Breathtaking turquoise waters and warm memories overlooking Pangong Tso with international travelers.",
    location: "Pangong Tso Lake (14,270 ft)",
    image: "https://res.cloudinary.com/efv1qjok/image/upload/v1792467737/ladakh_wayfarers/pangong_lake_travelers.jpg",
    publicId: "ladakh_wayfarers/pangong_lake_travelers",
    mediaType: "image"
  },
  {
    id: "gal-vid-expedition-01",
    title: "Himalayan Mountain Expedition Reel",
    category: "videos",
    caption: "Scenic drive across high Himalayan passes and sweeping mountain views with Ladakh Wayfarers.",
    location: "Khardung La & Nubra Valley Highway",
    image: "https://res.cloudinary.com/efv1qjok/video/upload/v1792466574/samples/cld-sample-video.mp4",
    publicId: "samples/cld-sample-video",
    mediaType: "video"
  },
  {
    id: "gal-01",
    title: "Toyota Innova Crysta at Pangong Tso",
    category: "lakes",
    caption: "Our tourist cab parked beside the pristine turquoise waters of Pangong Tso at 14,270 ft elevation.",
    location: "Pangong Tso Lake, Changthang",
    image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
    publicId: "",
    mediaType: "image"
  },
  {
    id: "gal-02",
    title: "Khardung La Pass Summit (17,982 ft)",
    category: "passes",
    caption: "Winter snowdrifts and prayer flags fluttering at the classic gateway to Nubra Valley.",
    location: "Khardung La Pass",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    publicId: "",
    mediaType: "image"
  }
];

const INITIAL_DRIVER_CONFIG = {
  driverName: "Stanzin Jigmet",
  brandName: "Ladakh Wayfarers",
  tagline: "High-Altitude Chauffeur & Mountain Guide",
  profileImage: "",
  profileImagePublicId: "",
  phone: "+91 97978 87369",
  whatsapp: "919797887369",
  whatsappNumber: "919797887369",
  displayPhone: "+91 97978 87369",
  email: "stanzinjigmet33@gmail.com",
  baseLocation: "Leh, Ladakh (Main Taxi Stand & Airport Pickups)",
  taxiUnionReg: "JK-10-B-7890 (All Ladakh Tour Operators Union)",
  primaryVehicle: "Toyota Innova Crysta 2.8 ZX (Luxury AC / Dual Heaters)",
  secondaryVehicle: "Mahindra Scorpio 4WD (Extreme Clearance)",
  drivingExperienceYears: "12+",
  safeExpeditionsCount: "650+",
  safetyFeatures: [
    "Medical Grade Portable Oxygen Cylinder (O2) on-board",
    "Digital Pulse-Oximeter for AMS monitoring",
    "Heavy-duty Snow Chains for Khardung La & Chang La",
    "Dual Heated Passenger Cabin & Fast USB Charging",
    "Inner Line Permit (ILP) & Protected Area assistance",
    "All Ladakh Taxi Union Official Fair Meter Tariff"
  ]
};

module.exports = {
  INITIAL_TOURS,
  INITIAL_REVIEWS,
  INITIAL_GALLERY,
  INITIAL_DRIVER_CONFIG
};
