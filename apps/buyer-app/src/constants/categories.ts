// D:/Electrons/apps/buyer-app/src/constants/categories.ts

export const categories = [
  "Mobile Phones",
  "Laptops",
  "Tablets",
  "Televisions",
  "Cameras",
  "Headphones",
  "Speakers",
  "Smart Watches",
  "Gaming Consoles",
  "Computer Accessories",
  "Home Appliances",
  "Kitchen Electronics",
  "Networking Devices",
  "Storage Devices",
  "Power Banks"
]

// ✅ Sub-categories mapping
export const subCategories: { [key: string]: string[] } = {
  "Mobile Phones": ["Smartphones", "Feature Phones", "Refurbished Phones", "Mobile Accessories", "Spare Parts"],
  "Laptops": ["Gaming Laptops", "Business Laptops", "Ultrabooks", "Chromebooks", "2-in-1 Laptops"],
  "Tablets": ["Android Tablets", "iPads", "Windows Tablets", "Kids Tablets"],
  "Televisions": ["OLED TVs", "QLED TVs", "LED/LCD TVs", "Smart TVs", "8K TVs"],
  "Cameras": ["DSLR Cameras", "Mirrorless Cameras", "Action Cameras", "Compact Cameras"],
  "Headphones": ["Over-Ear", "On-Ear", "In-Ear", "True Wireless", "Noise Cancelling"],
  "Speakers": ["Bluetooth Speakers", "Smart Speakers", "Soundbars", "Home Theatre"],
  "Smart Watches": ["Fitness Trackers", "Smartwatches", "Hybrid Watches", "Kids Watches"],
  "Gaming Consoles": ["PlayStation", "Xbox", "Nintendo Switch", "Gaming Accessories"],
  "Computer Accessories": ["Keyboards", "Mice", "Monitors", "Webcams", "External Drives"],
  "Home Appliances": ["Refrigerators", "Washing Machines", "ACs", "Microwave Ovens"],
  "Kitchen Electronics": ["Mixer Grinders", "Juicers", "Induction Cooktops", "Electric Kettles"],
  "Networking Devices": ["Routers", "Wi-Fi Extenders", "Switches", "Modems"],
  "Storage Devices": ["External HDD", "SSDs", "USB Drives", "Memory Cards"],
  "Power Banks": ["10000mAh", "20000mAh", "Fast Charging", "Wireless", "Solar"]
}

// ✅ Category Icons
export const categoryIcons: { [key: string]: string } = {
  "Mobile Phones": "📱",
  "Laptops": "💻",
  "Tablets": "📟",
  "Televisions": "📺",
  "Cameras": "📷",
  "Headphones": "🎧",
  "Speakers": "🔊",
  "Smart Watches": "⌚",
  "Gaming Consoles": "🎮",
  "Computer Accessories": "🖥️",
  "Home Appliances": "🏠",
  "Kitchen Electronics": "🍳",
  "Networking Devices": "🌐",
  "Storage Devices": "💾",
  "Power Banks": "🔋"
}