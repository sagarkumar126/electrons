import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { categories, subCategories, categoryIcons } from "../../constants/categories"
import RFQModal from "../../components/RFQModal/RFQModal"

const CATEGORIES_PER_PAGE = 7

const Home = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const [categoryPage, setCategoryPage] = useState(1)

  const [showRFQModal, setShowRFQModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products")
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (products.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [products])

  const goToSlide = (index: number) => setCurrentSlide(index)
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % products.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + products.length) % products.length)

  const handlePostRequirement = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user._id) {
      if (window.confirm("Please login first to post a requirement. Go to login?")) {
        navigate("/login")
      }
      return
    }
    navigate("/post-requirement")
  }

  const openRFQModal = (product: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user._id) {
      showToast("Please login first", "error")
      navigate("/login")
      return
    }
    setSelectedProduct(product)
    setShowRFQModal(true)
  }

  if (loading) return <div style={loadingStyle}>Loading...</div>

  const bestSellers = [...products].sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 8)
  const newArrivals = [...products].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 8)

  const trendingCategories = ["Smart Watches", "True Wireless Earphones", "Gaming Laptops", "OLED TVs"]
  const currentProduct = products[currentSlide]

  // ✅ Categories that have products
  const categoriesWithProducts = categories.filter((category) =>
    products.some((p) => p.category === category)
  )

  // ✅ Pagination math
  const totalCategoryPages = Math.ceil(categoriesWithProducts.length / CATEGORIES_PER_PAGE)
  const startIdx = (categoryPage - 1) * CATEGORIES_PER_PAGE
  const endIdx = startIdx + CATEGORIES_PER_PAGE
  const visibleCategories = categoriesWithProducts.slice(startIdx, endIdx)

  return (
    <div style={container}>

      {/* ============================================================ */}
      {/* ✅ SIRF PAGE 1 PE: Slider, Post Requirement, Best Sellers,  */}
      {/*    New Arrivals, Trending                                    */}
      {/* ============================================================ */}
      {categoryPage === 1 && (
        <>
          {/* SLIDER */}
          {products.length > 0 && (
            <div style={sliderContainer}>
              <div style={sliderWrapper}>
                <div style={slideImageWrapper}>
                  {currentProduct?.image && (
                    <img src={currentProduct.image} alt={currentProduct.name} style={slideImage} />
                  )}
                </div>
                <div style={slideContent}>
                  <span style={slideBadge}>⭐ Featured</span>
                  <h2 style={slideTitle}>{currentProduct?.name}</h2>
                  <p style={slidePrice}>₹{currentProduct?.price}</p>
                  <p style={slideCategory}>{currentProduct?.category}</p>
                  <button style={slideBtn} onClick={() => navigate(`/product/${currentProduct?._id}`)}>
                    Shop Now →
                  </button>
                </div>
              </div>

              <div style={sliderDots}>
                {products.slice(0, 8).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      ...dotStyle,
                      background: index === currentSlide ? "#ffffff" : "rgba(255,255,255,0.4)",
                      width: index === currentSlide ? "32px" : "10px"
                    }}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>

              <button style={sliderArrowLeft} onClick={prevSlide}>‹</button>
              <button style={sliderArrowRight} onClick={nextSlide}>›</button>
            </div>
          )}

          {/* POST REQUIREMENT */}
          <div
            style={{
              ...postRequirementSection,
              transform: isHovering ? "scale(1.01)" : "scale(1)",
              boxShadow: isHovering
                ? "0 12px 40px rgba(37, 99, 235, 0.35)"
                : "0 8px 30px rgba(37, 99, 235, 0.25)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div style={postRequirementContent}>
              <div style={postRequirementText}>
                <span style={postRequirementIcon}>📦</span>
                <div>
                  <h2 style={postRequirementTitle}>Looking for a product?</h2>
                  <p style={postRequirementSubtitle}>
                    Post your buy requirement and get multiple quotes from verified sellers
                  </p>
                </div>
              </div>
              <button
                style={{
                  ...postRequirementBtn,
                  transform: isHovering ? "scale(1.08)" : "scale(1)",
                  boxShadow: isHovering
                    ? "0 8px 30px rgba(37, 99, 235, 0.4)"
                    : "0 4px 15px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease"
                }}
                onClick={handlePostRequirement}
              >
                📝 Post Buy Requirement →
              </button>
            </div>
          </div>

          {/* BEST SELLERS */}
          <div style={sectionWrapper}>
            <div style={sectionHeader}>
              <h2 style={sectionTitle}>⭐ Best Sellers</h2>
              <span style={sectionBadge}>🔥 Hot</span>
            </div>
            <div style={productGrid}>
              {bestSellers.map((product) => (
                <ProductCardWithRFQ
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  onRFQClick={() => openRFQModal(product)}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>

          {/* NEW ARRIVALS */}
          <div style={sectionWrapper}>
            <div style={sectionHeader}>
              <h2 style={sectionTitle}>🆕 Newly Arrived</h2>
              <span style={sectionBadge}>✨ Fresh</span>
            </div>
            <div style={productGrid}>
              {newArrivals.map((product) => (
                <ProductCardWithRFQ
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  onRFQClick={() => openRFQModal(product)}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>

          {/* TRENDING */}
          <div style={sectionWrapper}>
            <h2 style={sectionTitle}>🔥 Trending Categories</h2>
            <div style={trendingGrid}>
              {trendingCategories.map((category) => (
                <div
                  key={category}
                  style={trendingCard}
                  onClick={() => navigate(`/category-page/${encodeURIComponent(category)}`)}
                >
                  <span style={trendingIcon}>{categoryIcons[category] || "📦"}</span>
                  <span style={trendingName}>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* ✅ SABHI PAGES PE: Categories (7 per page, 13 products each) */}
      {/* ============================================================ */}
      {visibleCategories.map((category) => {
        const categoryProducts = products.filter((p) => p.category === category)
        if (categoryProducts.length === 0) return null

        const displayProducts = categoryProducts.slice(0, 13)
        const subCats = subCategories[category] || []

        return (
          <div key={category} style={sectionWrapper}>
            <div style={categoryHeadingDiv}>
              <div style={categoryHeadingLeft}>
                <span style={categoryIcon}>{categoryIcons[category] || "📦"}</span>
                <h2 style={categoryTitle}>{category}</h2>
                <span style={categoryCount}>{categoryProducts.length} products</span>
              </div>
              <button
                style={viewAllBtn}
                onClick={() => navigate(`/category-page/${encodeURIComponent(category)}`)}
              >
                View All →
              </button>
            </div>

            {subCats.length > 0 && (
              <div style={subCategoryRow}>
                {subCats.map((sub) => (
                  <span
                    key={sub}
                    style={subCategoryChip}
                    onClick={() => navigate(`/category-page/${encodeURIComponent(category)}?sub=${encodeURIComponent(sub)}`)}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            )}

            <div style={productGrid}>
              {displayProducts.map((product) => (
                <ProductCardOnlyWishlist
                  key={product._id}
                  product={product}
                  navigate={navigate}
                  showToast={showToast}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* ============================================================ */}
      {/* ✅ PAGINATION — NO SCROLL                                    */}
      {/* ============================================================ */}
      {totalCategoryPages > 1 && (
        <div style={paginationWrapper}>
          <button
            style={{
              ...paginationBtn,
              opacity: categoryPage === 1 ? 0.4 : 1,
              cursor: categoryPage === 1 ? "not-allowed" : "pointer"
            }}
            disabled={categoryPage === 1}
            onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>

          {Array.from({ length: totalCategoryPages }).map((_, i) => {
            const pageNum = i + 1
            const isActive = pageNum === categoryPage
            return (
              <button
                key={pageNum}
                style={{
                  ...paginationNumBtn,
                  background: isActive ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "white",
                  color: isActive ? "white" : "#1e293b",
                  border: isActive ? "1px solid #2563eb" : "1px solid #cbd5e1",
                  boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
                }}
                onClick={() => setCategoryPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            style={{
              ...paginationBtn,
              opacity: categoryPage === totalCategoryPages ? 0.4 : 1,
              cursor: categoryPage === totalCategoryPages ? "not-allowed" : "pointer"
            }}
            disabled={categoryPage === totalCategoryPages}
            onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      {/* RFQ MODAL */}
      {showRFQModal && selectedProduct && (
        <RFQModal
          isOpen={showRFQModal}
          onClose={() => {
            setShowRFQModal(false)
            setSelectedProduct(null)
          }}
          cartItems={[{
            productId: selectedProduct._id,
            productName: selectedProduct.name,
            productImage: selectedProduct.image,
            quantity: 1,
            price: selectedProduct.price,
            sellerId: selectedProduct.sellerId
          }]}
          sellerId={selectedProduct.sellerId}
          sellerName={selectedProduct.company || "Seller"}
          buyerId={JSON.parse(localStorage.getItem("user") || "{}")._id || "guest"}
          buyerName={JSON.parse(localStorage.getItem("user") || "{}").name || "Buyer"}
          totalAmount={Number(selectedProduct.price)}
          moq={selectedProduct.moq || 1}
          maxStock={selectedProduct.stock || 999999}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div
          style={{
            ...toastStyle,
            background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            borderLeft: `5px solid ${toast.type === "success" ? "#22c55e" : "#ef4444"}`,
            color: toast.type === "success" ? "#166534" : "#991b1b"
          }}
        >
          <span style={{ fontSize: 18 }}>
            {toast.type === "success" ? "✅" : "❌"}
          </span>
          <span style={{ fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

// ================= PRODUCT CARD WITH RFQ + WISHLIST =================
const ProductCardWithRFQ = ({ product, navigate, onRFQClick, showToast }: any) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user._id) {
      showToast("Please login first", "error")
      navigate("/login")
      return
    }

    try {
      await fetch("http://localhost:5000/api/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user._id,
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          sellerId: product.sellerId
        })
      })
      showToast("❤️ Added to Wishlist!", "success")
    } catch (error) {
      showToast("❌ Failed to add to wishlist", "error")
    }
  }

  return (
    <div
      style={productCard}
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
        e.currentTarget.style.borderColor = "#2563eb"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)"
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"
        e.currentTarget.style.borderColor = "#cbd5e1"
      }}
    >
      {product.image && (
        <div style={imageWrapper}>
          <img src={product.image} alt={product.name} style={productImage} />
        </div>
      )}
      <h3 style={productName}>{product.name}</h3>
      <p style={productPrice}>₹{product.price}</p>
      <p style={productCategory}>{product.category}</p>

      <div style={buttonRow}>
        <button
          style={rfqBtn}
          onClick={(e) => {
            e.stopPropagation()
            onRFQClick()
          }}
        >
          📩 RFQ
        </button>
        <button style={addToWishlistBtn} onClick={handleWishlist}>
          +Wishlist
        </button>
      </div>
    </div>
  )
}

// ================= PRODUCT CARD - ONLY WISHLIST =================
const ProductCardOnlyWishlist = ({ product, navigate, showToast }: any) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user._id) {
      showToast("Please login first", "error")
      navigate("/login")
      return
    }

    try {
      await fetch("http://localhost:5000/api/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user._id,
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          sellerId: product.sellerId
        })
      })
      showToast("❤️ Added to Wishlist!", "success")
    } catch (error) {
      showToast("❌ Failed to add to wishlist", "error")
    }
  }

  return (
    <div
      style={productCard}
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"
        e.currentTarget.style.borderColor = "#2563eb"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)"
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"
        e.currentTarget.style.borderColor = "#cbd5e1"
      }}
    >
      {product.image && (
        <div style={imageWrapper}>
          <img src={product.image} alt={product.name} style={productImage} />
        </div>
      )}
      <h3 style={productName}>{product.name}</h3>
      <p style={productPrice}>₹{product.price}</p>
      <p style={productCategory}>{product.category}</p>

      <button style={addToWishlistBtnFull} onClick={handleWishlist}>
        +Wishlist
      </button>
    </div>
  )
}

// ================= STYLES =================
const container = {
  maxWidth: "100%",
  margin: "0",
  padding: "20px 40px",
  background: "#f1f5f9",
  minHeight: "100vh",
  borderRadius: "0"
}

const postRequirementSection = {
  marginBottom: "40px",
  padding: "30px 40px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #1e3a5f, #1e40af)",
  border: "2px solid #2563eb",
  boxShadow: "0 8px 30px rgba(37, 99, 235, 0.25)",
  transition: "all 0.3s ease",
  cursor: "pointer"
}

const postRequirementContent = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "20px"
}

const postRequirementText = {
  display: "flex",
  alignItems: "center",
  gap: "20px"
}

const postRequirementIcon = {
  fontSize: "48px",
  animation: "bounce 2s infinite"
}

const postRequirementTitle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#ffffff",
  margin: 0
}

const postRequirementSubtitle = {
  fontSize: "16px",
  color: "#bfdbfe",
  margin: "4px 0 0 0"
}

const postRequirementBtn = {
  padding: "16px 40px",
  background: "#ffffff",
  color: "#1e3a5f",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: "700",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
  whiteSpace: "nowrap" as const
}

const sliderContainer = {
  position: "relative" as const,
  marginBottom: "40px",
  borderRadius: "16px",
  overflow: "hidden" as const,
  background: "#dc2626",
  border: "2px solid #dc2626",
  boxShadow: "0 4px 20px rgba(220, 38, 38, 0.25)"
}

const sliderWrapper = {
  display: "flex",
  alignItems: "center",
  padding: "20px 40px",
  minHeight: "260px",
  gap: "40px"
}

const slideImageWrapper = {
  flex: "0 0 180px",
  height: "180px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  borderRadius: "12px",
  overflow: "hidden" as const
}

const slideImage = {
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
  padding: "10px"
}

const slideContent = { flex: 1 }

const slideBadge = {
  display: "inline-block",
  padding: "4px 14px",
  borderRadius: "50px",
  fontSize: "12px",
  fontWeight: "600",
  background: "rgba(255,255,255,0.20)",
  color: "#ffffff",
  marginBottom: "8px"
}

const slideTitle = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#ffffff",
  margin: "0 0 4px 0"
}

const slidePrice = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#fbbf24",
  margin: "0 0 2px 0"
}

const slideCategory = {
  fontSize: "14px",
  color: "#fca5a5",
  margin: "0 0 10px 0"
}

const slideBtn = {
  padding: "8px 20px",
  background: "#ffffff",
  color: "#dc2626",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease"
}

const sliderDots = {
  display: "flex",
  justifyContent: "center",
  gap: "6px",
  padding: "10px 0",
  background: "rgba(0,0,0,0.10)"
}

const dotStyle = {
  height: "6px",
  borderRadius: "3px",
  cursor: "pointer",
  transition: "all 0.3s ease"
}

const sliderArrowLeft = {
  position: "absolute" as const,
  top: "50%",
  left: "8px",
  transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.85)",
  border: "1px solid #ffffff",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  fontSize: "22px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  color: "#dc2626"
}

const sliderArrowRight = {
  ...sliderArrowLeft,
  left: "auto",
  right: "8px"
}

const sectionWrapper = {
  marginBottom: "40px",
  padding: "24px 28px",
  borderRadius: "16px",
  background: "#ffffff",
  border: "2px solid #cbd5e1",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  transition: "all 0.3s ease"
}

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
}

const sectionTitle = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0,
  letterSpacing: "0.5px"
}

const sectionBadge = {
  padding: "4px 14px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "600",
  background: "#fef3c7",
  color: "#b45309",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px"
}

const categoryHeadingDiv = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  marginBottom: "16px",
  borderRadius: "12px",
  background: "#1e3a5f",
  border: "2px solid #1e3a5f",
  borderLeft: "4px solid #60a5fa"
}

const categoryHeadingLeft = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
}

const categoryIcon = { fontSize: "24px" }

const categoryTitle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#ffffff",
  margin: 0
}

const categoryCount = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#bfdbfe",
  background: "rgba(255,255,255,0.15)",
  padding: "2px 12px",
  borderRadius: "20px"
}

const viewAllBtn = {
  padding: "6px 18px",
  background: "rgba(255,255,255,0.15)",
  color: "#ffffff",
  border: "1px solid #60a5fa",
  borderRadius: "50px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  transition: "all 0.3s ease"
}

const productGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "24px"
}

const productCard = {
  background: "#ffffff",
  padding: "16px",
  borderRadius: "14px",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  border: "2px solid #cbd5e1",
  display: "flex",
  flexDirection: "column" as const
}

const imageWrapper = {
  width: "100%",
  height: "160px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8fafc",
  borderRadius: "10px",
  marginBottom: "12px",
  overflow: "hidden" as const
}

const productImage = {
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
  borderRadius: "8px",
  padding: "8px"
}

const productName = {
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "4px",
  color: "#0f172a",
  lineHeight: "1.4"
}

const productPrice = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#16a34a",
  marginBottom: "2px"
}

const productCategory = {
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "8px"
}

const buttonRow = {
  display: "flex",
  gap: "8px",
  marginTop: "8px",
  flexWrap: "wrap" as const,
  width: "100%"
}

const rfqBtn = {
  padding: "6px 10px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  flex: 1,
  minWidth: "60px",
  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.25)"
}

const addToWishlistBtn = {
  padding: "6px 10px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  flex: 1,
  minWidth: "60px",
  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)"
}

const addToWishlistBtnFull = {
  padding: "6px 10px",
  background: "#22c55e",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  width: "100%",
  marginTop: "8px",
  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.25)"
}

const trendingGrid = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap" as const
}

const trendingCard = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 24px",
  background: "#f8fafc",
  borderRadius: "50px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  color: "#0f172a",
  border: "2px solid #cbd5e1",
  transition: "all 0.3s ease",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
}

const trendingIcon = { fontSize: "20px" }
const trendingName = { fontSize: "14px", fontWeight: "500" }

const subCategoryRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginBottom: "16px"
}

const subCategoryChip = {
  padding: "6px 16px",
  background: "#f1f5f9",
  borderRadius: "50px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#1e293b",
  border: "2px solid #cbd5e1",
  cursor: "pointer",
  transition: "all 0.2s ease"
}

const paginationWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  marginTop: "10px",
  marginBottom: "40px",
  flexWrap: "wrap" as const
}

const paginationBtn = {
  padding: "10px 20px",
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  color: "#1e293b",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
}

const paginationNumBtn = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease"
}

const loadingStyle = {
  textAlign: "center" as const,
  padding: "60px",
  fontSize: "18px",
  color: "#0f172a",
  background: "#f1f5f9",
  minHeight: "100vh"
}

const toastStyle: React.CSSProperties = {
  position: "fixed",
  top: 24,
  right: 24,
  background: "#dcfce7",
  padding: "14px 20px",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  zIndex: 99999,
  animation: "slideInRight 0.3s ease",
  minWidth: 220
}

const style = document.createElement('style')
style.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
`
document.head.appendChild(style)

export default Home