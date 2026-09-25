// D:/Electrons/apps/buyer-app/src/pages/CategoryPage/CategoryPage.tsx

import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { API_URL } from "../../config"

const CategoryPage = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // ✅ FIXED: sub-categories now come from API
  const [categorySubCategories, setCategorySubCategories] = useState<string[]>([])

  const subFromUrl = searchParams.get("sub")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(subFromUrl)

  const decodedCategory = decodeURIComponent(category || "")

  useEffect(() => {
    fetchCategoryData()
    fetchSubCategories()
  }, [category])

  useEffect(() => {
    const sub = searchParams.get("sub")
    setSelectedSubCategory(sub)
  }, [searchParams])

  const fetchCategoryData = async () => {
    try {
      setLoading(true)

      const productsRes = await fetch(`${API_URL}/products`)
      const allProducts = await productsRes.json()
      const filteredProducts = allProducts.filter((p: any) => p.category === decodedCategory)
      setProducts(filteredProducts)

    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: fetch sub-categories from API
  const fetchSubCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/all`)
      const data = await res.json()
      const allCats = data.data || []
      const found = allCats.find((c: any) => c.name === decodedCategory)
      setCategorySubCategories(found?.subCategories || [])
    } catch (error) {
      console.error("Error fetching sub-categories:", error)
      setCategorySubCategories([])
    }
  }

  const filteredProducts = products.filter((p) => {
    if (selectedSubCategory && p.subCategory !== selectedSubCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query)
      )
    }
    return true
  })

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>
  }

  return (
    <div style={container}>

      <div style={headerContainer}>
        <h1 style={heading}>
          📦 {decodedCategory}
        </h1>
        <p style={subHeading}>
          {filteredProducts.length} products found
          {selectedSubCategory && ` in "${selectedSubCategory}"`}
        </p>
      </div>

      <div style={searchContainer}>
        <input
          type="text"
          placeholder={`Search in ${decodedCategory}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInput}
        />
        {searchQuery && (
          <button
            style={clearBtn}
            onClick={() => setSearchQuery("")}
          >
            ✕
          </button>
        )}
        <button style={searchBtn}>🔍</button>
      </div>

      <div style={mainLayout}>

        <div style={sidebar}>
          <div
            style={!selectedSubCategory ? sidebarItemActive : sidebarItem}
            onClick={() => {
              setSelectedSubCategory(null)
              navigate(`/category-page/${encodeURIComponent(decodedCategory)}`)
            }}
          >
            All {decodedCategory}
          </div>

          {categorySubCategories.map((sub) => (
            <div
              key={sub}
              style={selectedSubCategory === sub ? sidebarItemActive : sidebarItem}
              onClick={() => {
                setSelectedSubCategory(sub)
                navigate(`/category-page/${encodeURIComponent(decodedCategory)}?sub=${encodeURIComponent(sub)}`)
              }}
            >
              {sub}
            </div>
          ))}
        </div>

        <div style={rightContent}>
          {filteredProducts.length === 0 ? (
            <p style={noData}>No products found in this category</p>
          ) : (
            <div style={productGrid}>
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  style={productCard}
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.image && (
                    <img src={product.image} alt={product.name} style={productImage} />
                  )}
                  <h3 style={productName}>{product.name}</h3>
                  <p style={productPrice}>₹{product.price}</p>
                  <p style={productCategory}>{product.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

// ================= STYLES (FULL WIDTH) =================

const container = {
  maxWidth: "100%",
  margin: "0",
  padding: "20px 40px",
  background: "#e5e7eb",
  minHeight: "100vh",
  borderRadius: "0"
}

const headerContainer = {
  marginBottom: "15px"
}

const heading = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#1e293b",
  margin: 0
}

const subHeading = {
  fontSize: "14px",
  color: "#64748b",
  marginTop: "4px"
}

const searchContainer = {
  display: "flex",
  gap: "10px",
  marginBottom: "25px",
  alignItems: "center"
}

const searchInput = {
  flex: 1,
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
  background: "white"
}

const searchBtn = {
  padding: "12px 24px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold"
}

const clearBtn = {
  padding: "12px 16px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold"
}

const mainLayout = {
  display: "flex",
  gap: "30px",
  alignItems: "flex-start" as const
}

const sidebar = {
  width: "220px",
  minWidth: "220px",
  background: "#f3f4f6",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  position: "sticky" as const,
  top: "20px"
}

const sidebarItem = {
  padding: "10px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  color: "#64748b",
  transition: "all 0.2s",
  marginBottom: "4px"
}

const sidebarItemActive = {
  ...sidebarItem,
  background: "#2563eb",
  color: "white",
  fontWeight: "500"
}

const rightContent = {
  flex: 1,
  minWidth: 0
}

const productGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "20px"
}

const productCard = {
  background: "white",
  padding: "15px",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0 4px 12px rgba(0,0,0,0.10)"
}

const productImage = {
  width: "100%",
  height: "140px",
  objectFit: "contain" as const,
  borderRadius: "8px",
  marginBottom: "10px"
}

const productName = {
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "4px",
  color: "#1e293b"
}

const productPrice = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#16a34a"
}

const productCategory = {
  fontSize: "12px",
  color: "#64748b"
}

const noData = {
  color: "#94a3b8",
  fontSize: "16px",
  textAlign: "center" as const,
  padding: "40px"
}

const loadingStyle = {
  textAlign: "center" as const,
  padding: "60px",
  fontSize: "18px",
  color: "#64748b"
}

export default CategoryPage