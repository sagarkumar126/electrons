import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import FilterSidebar from "../../components/FilterSidebar/FilterSidebar"
import { API_URL } from "../../config"

const Products = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`)
      const data = await res.json()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (newFilters: any) => {
    setFilters(newFilters)
    let result = [...products]

    if (newFilters.category) {
      result = result.filter(p => p.category === newFilters.category)
    }
    if (newFilters.priceRange?.min) {
      result = result.filter(p => Number(p.price) >= Number(newFilters.priceRange.min))
    }
    if (newFilters.priceRange?.max) {
      result = result.filter(p => Number(p.price) <= Number(newFilters.priceRange.max))
    }
    if (newFilters.moq) {
      result = result.filter(p => Number(p.moq) <= Number(newFilters.moq))
    }
    if (newFilters.inStock) {
      result = result.filter(p => Number(p.stock) > 0)
    }
    if (newFilters.verifiedSellers) {
      result = result.filter(p => p.sellerVerified === true)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query)
      )
    }
    switch(sortBy) {
      case "priceLow":
        result.sort((a, b) => Number(a.price) - Number(b.price))
        break
      case "priceHigh":
        result.sort((a, b) => Number(b.price) - Number(a.price))
        break
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    setFilteredProducts(result)
  }

  const handleSearch = () => applyFilters(filters)
  const clearFilters = () => {
    setFilters({})
    setSearchQuery("")
    setFilteredProducts(products)
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>

  return (
    <div style={container}>
      <div style={topBar}>
        <div style={searchSection}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            style={searchInput}
          />
          <button onClick={handleSearch} style={searchBtn}>🔍</button>
        </div>
        <div style={rightSection}>
          <select 
            value={sortBy} 
            onChange={(e) => { setSortBy(e.target.value); applyFilters(filters) }}
            style={sortSelect}
          >
            <option value="newest">Newest</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
          </select>
          <button onClick={() => setShowFilter(true)} style={filterBtn}>🔽 Filters</button>
          {Object.keys(filters).length > 0 && (
            <button onClick={clearFilters} style={clearFiltersBtn}>✕ Clear</button>
          )}
        </div>
      </div>

      <p style={countText}>Showing {filteredProducts.length} products</p>

      <div style={grid}>
        {filteredProducts.length === 0 ? (
          <div style={emptyState}>
            <p>No products found</p>
            <button onClick={clearFilters} style={clearBtn}>Clear Filters</button>
          </div>
        ) : (
          filteredProducts.map((product: any) => (
            <div key={product._id} style={card} onClick={() => navigate(`/product/${product._id}`)}>
              {product.image && <img src={product.image} alt={product.name} style={image} />}
              <h3 style={name}>{product.name}</h3>
              <p style={price}>₹{product.price}</p>
              <p style={category}>{product.category}</p>
              {product.moq > 0 && <p style={moqBadge}>MOQ: {product.moq}</p>}
              {Number(product.stock) === 0 && <p style={outOfStock}>Out of Stock</p>}
            </div>
          ))
        )}
      </div>

      <FilterSidebar
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onFilterChange={(newFilters) => {
          setFilters(newFilters)
          applyFilters(newFilters)
        }}
      />
    </div>
  )
}

const container = { padding: 20, maxWidth: 1200, margin: "auto" }
const topBar = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 15, marginBottom: 20 }
const searchSection = { display: "flex", gap: 10, flex: 1, maxWidth: 450 }
const searchInput = { flex: 1, padding: "10px 15px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" }
const searchBtn = { padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }
const rightSection = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }
const sortSelect = { padding: "10px 15px", borderRadius: 8, border: "1px solid #ddd", background: "white", fontSize: 14 }
const filterBtn = { padding: "10px 20px", background: "#f3f4f6", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }
const clearFiltersBtn = { padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }
const countText = { color: "#6b7280", fontSize: 14, marginBottom: 20 }
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }
const card = { background: "white", borderRadius: 12, padding: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", transition: "0.2s", border: "1px solid #eee" }
const image = { width: "100%", height: 150, objectFit: "cover" as const, borderRadius: 8, marginBottom: 10 }
const name = { fontSize: 16, fontWeight: 600, margin: "8px 0 4px" }
const price = { fontSize: 18, fontWeight: "bold", color: "#16a34a", margin: "4px 0" }
const category = { fontSize: 13, color: "#6b7280", margin: "4px 0" }
const moqBadge = { fontSize: 12, color: "#f59e0b", margin: "4px 0" }
const outOfStock = { fontSize: 12, color: "#ef4444", fontWeight: "bold", marginTop: 8 }
const emptyState = { gridColumn: "1 / -1", textAlign: "center" as const, padding: 40, color: "#6b7280" }
const clearBtn = { padding: "8px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", marginTop: 10 }

export default Products