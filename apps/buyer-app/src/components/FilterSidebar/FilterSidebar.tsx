import { useState } from "react"

interface FilterProps {
  onFilterChange: (filters: any) => void
  onClose: () => void
  isOpen: boolean
}

const FilterSidebar = ({ onFilterChange, onClose, isOpen }: FilterProps) => {
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedMOQ, setSelectedMOQ] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [inStock, setInStock] = useState(false)
  const [verifiedSellers, setVerifiedSellers] = useState(false)

  const applyFilters = () => {
    onFilterChange({
      priceRange,
      category: selectedCategory,
      brand: selectedBrand,
      moq: selectedMOQ,
      sortBy,
      inStock,
      verifiedSellers
    })
    onClose()
  }

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" })
    setSelectedCategory("")
    setSelectedBrand("")
    setSelectedMOQ("")
    setSortBy("newest")
    setInStock(false)
    setVerifiedSellers(false)
    onFilterChange({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={overlay}>
      <div style={sidebar}>
        <div style={header}>
          <h3>🔍 Filters</h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Sort By */}
        <div style={section}>
          <label style={label}>Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={select}
          >
            <option value="newest">Newest First</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {/* Price Range */}
        <div style={section}>
          <label style={label}>Price Range</label>
          <div style={priceRow}>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              style={priceInput}
            />
            <span style={priceSep}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              style={priceInput}
            />
          </div>
        </div>

        {/* Category */}
        <div style={section}>
          <label style={label}>Category</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={select}
          >
            <option value="">All Categories</option>
            <option value="Mobile Phones">Mobile Phones</option>
            <option value="Laptops">Laptops</option>
            <option value="Tablets">Tablets</option>
            <option value="Televisions">Televisions</option>
            <option value="Cameras">Cameras</option>
            <option value="Headphones">Headphones</option>
          </select>
        </div>

        {/* MOQ */}
        <div style={section}>
          <label style={label}>MOQ</label>
          <select 
            value={selectedMOQ} 
            onChange={(e) => setSelectedMOQ(e.target.value)}
            style={select}
          >
            <option value="">Any MOQ</option>
            <option value="10">10+ units</option>
            <option value="25">25+ units</option>
            <option value="50">50+ units</option>
            <option value="100">100+ units</option>
            <option value="500">500+ units</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div style={section}>
          <label style={checkboxLabel}>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            In Stock Only
          </label>
          <label style={checkboxLabel}>
            <input
              type="checkbox"
              checked={verifiedSellers}
              onChange={(e) => setVerifiedSellers(e.target.checked)}
            />
            Verified Sellers Only
          </label>
        </div>

        {/* Buttons */}
        <div style={btnRow}>
          <button onClick={applyFilters} style={applyBtn}>
            Apply Filters
          </button>
          <button onClick={clearFilters} style={clearBtn}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= STYLES =================

const overlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end"
}

const sidebar = {
  width: 350,
  maxWidth: "90%",
  background: "white",
  height: "100vh",
  overflowY: "auto" as const,
  padding: 20,
  animation: "slideIn 0.3s ease"
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
  paddingBottom: 10,
  borderBottom: "1px solid #eee"
}

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: 20,
  cursor: "pointer",
  color: "#666"
}

const section = {
  marginBottom: 20
}

const label = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 8,
  color: "#333"
}

const select = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14
}

const priceRow = {
  display: "flex",
  alignItems: "center",
  gap: 10
}

const priceInput = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 14
}

const priceSep = {
  color: "#666"
}

const checkboxLabel = {
  display: "block",
  marginBottom: 8,
  cursor: "pointer"
}

const btnRow = {
  display: "flex",
  gap: 10,
  marginTop: 20
}

const applyBtn = {
  flex: 1,
  padding: 12,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
}

const clearBtn = {
  flex: 1,
  padding: 12,
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
}

export default FilterSidebar