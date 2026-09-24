// seller-app/src/data/localProductCatalog.ts
// ✅ LOCAL CATALOG - No API needed. Search happens on the client.

export interface CatalogProduct {
  name: string
  company: string
  category: string
  subCategory: string
  price: number
  details: string
  keywords: string[]
  image?: string
  extraFields?: { title: string; description: string }[]
}

export const localProductCatalog: CatalogProduct[] = [

  // ==================== SPEAKERS ====================

  // -------------------- Bluetooth Speakers --------------------
  {
    name: "boAt Stone 352/358 Bluetooth Speaker (Raging Black)",
    company: "boAt",
    category: "Speakers",
    subCategory: "Bluetooth Speakers",
    price: 1499,
    details: "10W RMS stereo sound with IPX7 water resistance. TWS feature to pair two speakers for stereo effect. Up to 12 hours of total playtime. Multi-compatibility modes: Bluetooth, AUX, and TF Card. Bluetooth range up to 10 meters.",
    keywords: ["boat", "stone 352", "stone 358", "bluetooth speaker", "portable", "ipx7", "10w"],
    extraFields: [
      { title: "Output", description: "10W RMS Stereo" },
      { title: "Battery", description: "Up to 12 hours" },
      { title: "Water Resistance", description: "IPX7" },
      { title: "Connectivity", description: "Bluetooth, AUX, TF Card" },
      { title: "Warranty", description: "1 Year boAt India Warranty" }
    ]
  },

  // -------------------- Smart Speakers --------------------
  {
    name: "Amazon Echo Dot (5th Gen) | Smart speaker with Alexa",
    company: "Amazon",
    category: "Speakers",
    subCategory: "Smart Speakers",
    price: 4949,
    details: "Vibrant sound with deeper bass and clearer vocals than previous generations. Built-in motion detection and temperature sensor for smart home automation. Alexa speaks both English and Hindi. Can control smart home devices like lights, ACs, and TVs via voice. Wi-Fi and Bluetooth connectivity.",
    keywords: ["amazon", "echo dot", "5th gen", "smart speaker", "alexa", "wifi", "smart home"],
    extraFields: [
      { title: "Voice Assistant", description: "Alexa (English & Hindi)" },
      { title: "Connectivity", description: "Wi-Fi, Bluetooth" },
      { title: "Sensors", description: "Motion Detection, Temperature" },
      { title: "Warranty", description: "1 Year Amazon India Warranty" }
    ]
  }

]

// ✅ Simple search function (fuzzy word match)
export const searchCatalog = (query: string): CatalogProduct[] => {
  const q = query.trim().toLowerCase()
  if (!q || q.length < 2) return []

  const exact = localProductCatalog.filter(p => {
    const haystack = [p.name, p.company, p.category, p.subCategory, ...p.keywords]
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })

  if (exact.length > 0) return exact.slice(0, 8)

  const words = q.split(/\s+/).filter(w => w.length > 2)
  return localProductCatalog
    .filter(p => {
      const haystack = [p.name, p.company, p.category, ...p.keywords]
        .join(" ")
        .toLowerCase()
      return words.some(w => haystack.includes(w))
    })
    .slice(0, 8)
}