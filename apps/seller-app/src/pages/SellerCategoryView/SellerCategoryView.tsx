import { useEffect, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"

const SellerCategoryView = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // ✅ FIXED: fetch categories from API
  const [apiCategories, setApiCategories] = useState<any[]>([])

  // ✅ NEW: Photo editor state
  const [photoEditProduct, setPhotoEditProduct] = useState<any>(null)
  const [photoEditImages, setPhotoEditImages] = useState<any[]>([])

  const decodedCategory = decodeURIComponent(category || "")
  const subFromUrl = searchParams.get("sub")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(subFromUrl)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // ✅ FIXED: load categories from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories/all")
        const data = await res.json()
        setApiCategories(data.data || [])
      } catch (err) {
        console.error("Failed to load categories:", err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [category])

  useEffect(() => {
    const sub = searchParams.get("sub")
    setSelectedSubCategory(sub)
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/products/seller/${user._id}`)
      const data = await res.json()
      const filtered = data.filter((p: any) => p.category === decodedCategory)
      setProducts(filtered)
      setFilteredProducts(filtered)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Delete product
  const deleteProduct = async (item: any) => {
    const confirmDelete = window.confirm(`Delete ${item.name}?`)
    if (!confirmDelete) return
    await fetch(`http://localhost:5000/api/products/${item._id}`, {
      method: "DELETE"
    })
    fetchProducts()
  }

  // ✅ NEW: Open photo editor
  const openPhotoEditor = (item: any) => {
    setPhotoEditProduct(item)
    setPhotoEditImages(item.images || [])
  }

  // ✅ NEW: Remove a photo
  const removePhoto = (index: number) => {
    const updated = [...photoEditImages]
    updated.splice(index, 1)
    setPhotoEditImages(updated)
  }

  // ✅ NEW: Save photos
  const savePhotos = async () => {
    const updatedProduct = {
      ...photoEditProduct,
      images: photoEditImages,
      image: photoEditImages[0] || ""
    }
    delete updatedProduct._id
    await fetch(`http://localhost:5000/api/products/${photoEditProduct._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct)
    })
    setPhotoEditProduct(null)
    setPhotoEditImages([])
    fetchProducts()
  }

  // ✅ FIXED: derive sub-categories from API data
  const selectedCatData = apiCategories.find((c: any) => c.name === decodedCategory)
  const categorySubCategories: string[] = selectedCatData?.subCategories || []

  // Filter by sub-category + search
  useEffect(() => {
    let filtered = products

    if (selectedSubCategory) {
      filtered = filtered.filter((p) => p.subCategory === selectedSubCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query)
      )
    }

    setFilteredProducts(filtered)
  }, [selectedSubCategory, searchQuery, products])

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  }

  return (
    <div style={container}>
      {/* Header with Back Button */}
      <div style={headerContainer}>
        <button
          onClick={() => navigate("/all-products")}
          style={backBtn}
        >
          ← Back to All Products
        </button>
        <h1 style={heading}>
          📦 {decodedCategory}
        </h1>
        <p style={subHeading}>
          {filteredProducts.length} products found
          {selectedSubCategory && ` in "${selectedSubCategory}"`}
        </p>
      </div>

      {/* Search Bar */}
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

      {/* Main Layout - Sidebar + Products */}
      <div style={mainLayout}>

        {/* LEFT SIDEBAR - Sub-categories */}
        <div style={sidebar}>
          <div
            style={!selectedSubCategory ? sidebarItemActive : sidebarItem}
            onClick={() => {
              setSelectedSubCategory(null)
              navigate(`/seller/category/${encodeURIComponent(decodedCategory)}`)
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
                navigate(`/seller/category/${encodeURIComponent(decodedCategory)}?sub=${encodeURIComponent(sub)}`)
              }}
            >
              {sub}
            </div>
          ))}
        </div>

        {/* RIGHT CONTENT - Products */}
        <div style={rightContent}>
          {filteredProducts.length === 0 ? (
            <p style={noData}>No products found in this category</p>
          ) : (
            <div style={productGrid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  onDelete={deleteProduct}
                  onEditPhoto={openPhotoEditor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ NEW: PHOTO EDITOR MODAL */}
      {photoEditProduct && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginTop: 0 }}>Edit Photos</h2>
            {photoEditImages.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No photos</p>
            )}
            {photoEditImages.map((img, index) => (
              <div key={index} style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "center" }}>
                <img
                  src={img}
                  style={{
                    width: "55px",
                    height: "55px",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
                <button
                  onClick={() => removePhoto(index)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <div style={{ marginTop: "18px", display: "flex", gap: "10px" }}>
              <button
                onClick={savePhotos}
                style={{
                  background: "#16a34a",
                  color: "white",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Save
              </button>
              <button
                onClick={() => setPhotoEditProduct(null)}
                style={{
                  background: "#6b7280",
                  color: "white",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= ✅ PRODUCT CARD (NEW — same as SellerAllProducts) =================
const ProductCard = ({ product, navigate, onDelete, onEditPhoto }: any) => {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.12)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)"
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"
      }}
      onClick={() => navigate(`/seller/product/${product._id}`)}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%",
            height: "160px",
            objectFit: "cover"
          }}
        />
      ) : (
        <div style={{
          width: "100%",
          height: "160px",
          background: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          color: "#94a3b8"
        }}>
          No Image
        </div>
      )}

      <div style={{ padding: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 4px 0", color: "#0f172a" }}>
          {product.name}
        </h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 2px 0" }}>
          {product.company}
        </p>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0" }}>
          {product.category || "Uncategorized"} {product.subCategory && `→ ${product.subCategory}`}
        </p>
        <p style={{ fontSize: "18px", fontWeight: "bold", color: "#16a34a", margin: "0 0 8px 0" }}>
          ₹{product.price}
        </p>
        <p style={{
          fontSize: "13px",
          color: product.stock > 0 ? "#16a34a" : "#dc2626",
          fontWeight: "bold",
          margin: "0 0 10px 0"
        }}>
          Stock: {product.stock} {product.stock === 0 && "❌"}
        </p>

        <div style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/products?editId=${product._id}`)
            }}
            style={{
              padding: "6px 12px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(product)
            }}
            style={{
              padding: "6px 12px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🗑️ Delete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditPhoto(product)
            }}
            style={{
              padding: "6px 12px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📸 Photos
          </button>
        </div>
      </div>
    </div>
  )
}

// ================= STYLES (UNCHANGED + 2 NEW) =================

const container = {
  maxWidth: "100%",
  margin: "0",
  padding: "20px 40px",
  background: "#f1f5f9",
  minHeight: "100vh"
}

const headerContainer = {
  marginBottom: "20px"
}

const backBtn = {
  padding: "8px 16px",
  background: "none",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  marginBottom: "10px",
  color: "#1e293b"
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

// ✅ NEW: Modal styles (same as SellerAllProducts)
const modalOverlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
}

const modalContent = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  width: "420px",
  maxWidth: "90%",
  maxHeight: "80vh",
  overflowY: "auto" as const
}

const noData = {
  color: "#94a3b8",
  fontSize: "16px",
  textAlign: "center" as const,
  padding: "40px"
}

export default SellerCategoryView