import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const SellerAllProducts = () => {

  const [products, setProducts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // ✅ FIXED: categories from API
  const [apiCategories, setApiCategories] = useState<any[]>([])

  const [photoEditProduct, setPhotoEditProduct] = useState<any>(null)
  const [photoEditImages, setPhotoEditImages] = useState<any[]>([])

  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  // ✅ FIXED: load categories from API
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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `http://localhost:5000/api/products/seller/${user._id}`
      )
      const data = await res.json()
      setProducts(data)
      setFiltered(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterProducts(query, selectedCategory)
  }

  const handleCategoryClick = (category: string) => {
    navigate(`/seller/category/${encodeURIComponent(category)}`)
  }

  const filterProducts = (query: string, category: string) => {
    let filteredData = products

    if (category) {
      filteredData = filteredData.filter((p) => p.category === category)
    }

    if (query.trim()) {
      filteredData = filteredData.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase()) ||
        p.company?.toLowerCase().includes(query.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(query.toLowerCase())
      )
    }

    setFiltered(filteredData)
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSearchQuery("")
    setFiltered(products)
  }

  const deleteProduct = async (item: any) => {
    const confirmDelete = window.confirm(`Delete ${item.name}?`)
    if (!confirmDelete) return
    await fetch(`http://localhost:5000/api/products/${item._id}`, {
      method: "DELETE"
    })
    fetchProducts()
  }

  const openPhotoEditor = (item: any) => {
    setPhotoEditProduct(item)
    setPhotoEditImages(item.images || [])
  }

  const removePhoto = (index: number) => {
    const updated = [...photoEditImages]
    updated.splice(index, 1)
    setPhotoEditImages(updated)
  }

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

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading products...</div>
  }

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "auto" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#111827,#7c3aed)",
        borderRadius: "14px",
        padding: "14px 18px",
        marginBottom: "20px",
        color: "white",
        boxShadow: "0 5px 18px rgba(0,0,0,0.12)"
      }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          📦 All My Products ({products.length})
        </h1>
      </div>

      {/* ✅ CATEGORIES NAVBAR - now from API */}
      <div style={categoriesNav}>
        <button
          style={{
            ...categoryNavBtn,
            background: !selectedCategory ? "#2563eb" : "transparent",
            color: !selectedCategory ? "white" : "#64748b",
            border: !selectedCategory ? "1px solid #2563eb" : "1px solid #e2e8f0"
          }}
          onClick={() => navigate("/all-products")}
        >
          All
        </button>
        {apiCategories.map((cat: any) => (
          <button
            key={cat._id}
            style={{
              ...categoryNavBtn,
              background: selectedCategory === cat.name ? "#2563eb" : "transparent",
              color: selectedCategory === cat.name ? "white" : "#64748b",
              border: selectedCategory === cat.name ? "1px solid #2563eb" : "1px solid #e2e8f0"
            }}
            onClick={() => handleCategoryClick(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            outline: "none",
            background: "white"
          }}
        />
        {(searchQuery || selectedCategory) && (
          <button
            onClick={clearFilters}
            style={{
              padding: "10px 18px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* ✅ UNCATEGORIZED PRODUCTS */}
      {/* ============================================================ */}
      {(() => {
        const uncategorizedProducts = filtered.filter((p) => !p.category || p.category === "")
        if (uncategorizedProducts.length === 0) return null

        return (
          <div style={{
            marginBottom: "40px",
            padding: "20px",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              padding: "10px 14px",
              background: "#fef3c7",
              borderRadius: "8px",
              borderLeft: "4px solid #f59e0b"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#92400e", margin: 0 }}>
                📂 Uncategorized ({uncategorizedProducts.length})
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px"
            }}>
              {uncategorizedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  onDelete={deleteProduct}
                  onEditPhoto={openPhotoEditor}
                />
              ))}
            </div>
          </div>
        )
      })()}

      {/* ======== CATEGORIES WISE PRODUCTS - now from API ======== */}
      {apiCategories.map((cat: any) => {
        const category = cat.name
        const categoryProducts = filtered.filter((p) => p.category === category)
        if (categoryProducts.length === 0) return null

        const displayProducts = categoryProducts.slice(0, 8)
        const subCats: string[] = cat.subCategories || []

        return (
          <div key={cat._id} style={{
            marginBottom: "40px",
            padding: "20px",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}>

            {/* Category Heading */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: "8px",
              borderLeft: "4px solid #7c3aed"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>
                {category} ({categoryProducts.length})
              </h2>
              <button
                onClick={() => {
                  navigate(`/seller/category/${encodeURIComponent(category)}`)
                }}
                style={{
                  padding: "6px 16px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                View More →
              </button>
            </div>

            {subCats.length > 0 && (
              <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "15px",
                padding: "0 4px"
              }}>
                {subCats.map((sub) => (
                  <span
                    key={sub}
                    onClick={() => {
                      navigate(`/seller/category/${encodeURIComponent(category)}?sub=${encodeURIComponent(sub)}`)
                    }}
                    style={{
                      padding: "4px 14px",
                      background: "#f1f5f9",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#1e293b",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            )}

            {/* Products Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px"
            }}>
              {displayProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  onDelete={deleteProduct}
                  onEditPhoto={openPhotoEditor}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* ======== FILTERED VIEW ======== */}
      {(searchQuery || selectedCategory) && filtered.length !== products.length && (
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>
              Filtered Products ({filtered.length})
            </h2>
            <button
              onClick={clearFilters}
              style={{
                padding: "6px 16px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500"
              }}
            >
              ✕ Clear Filter
            </button>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px"
          }}>
            {filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                navigate={navigate}
                onDelete={deleteProduct}
                onEditPhoto={openPhotoEditor}
              />
            ))}
          </div>
        </div>
      )}

      {/* PHOTO EDITOR MODAL */}
      {photoEditProduct && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginTop: 0 }}>Edit Photos</h2>
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

// ================= PRODUCT CARD =================
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

// ================= STYLES =================

const categoriesNav = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
  marginBottom: "20px",
  padding: "12px 16px",
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
}

const categoryNavBtn = {
  padding: "6px 16px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "1px solid #e2e8f0",
  background: "transparent",
  color: "#64748b"
}

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

export default SellerAllProducts