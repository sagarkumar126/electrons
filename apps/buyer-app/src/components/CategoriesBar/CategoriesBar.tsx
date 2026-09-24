// D:/Electrons/apps/buyer-app/src/components/CategoriesBar/CategoriesBar.tsx

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const VISIBLE_LIMIT = 10  // ✅ Kitni categories navbar mein dikhein

const CategoriesBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // ✅ FIXED: categories ab API se aayengi
  const [categories, setCategories] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories/all")
        const data = await res.json()
        const names = (data.data || []).map((c: any) => c.name)
        setCategories(names)
      } catch (err) {
        console.error("Failed to load categories:", err)
      }
    }
    load()
  }, [])

  // Sirf homepage pe dikhega
  if (location.pathname !== "/") {
    return null
  }

  const visibleCategories = categories.slice(0, VISIBLE_LIMIT)
  const hasMore = categories.length > VISIBLE_LIMIT
  const remainingCount = categories.length - VISIBLE_LIMIT

  const goToCategory = (cat: string) => {
    setShowAll(false)
    navigate(`/category-page/${encodeURIComponent(cat)}`)
  }

  return (
    <>
      <div style={container}>
        <div style={categoriesWrapper}>
          <div
            onClick={() => navigate("/")}
            style={categoryItemAll}
          >
            All
          </div>

          {visibleCategories.map((category) => (
            <div
              key={category}
              onClick={() => goToCategory(category)}
              style={categoryItem}
            >
              {category}
            </div>
          ))}

          {hasMore && (
            <div
              onClick={() => setShowAll(true)}
              style={moreBtn}
            >
              +{remainingCount} More ▾
            </div>
          )}
        </div>
      </div>

      {/* =========== VIEW ALL MODAL =========== */}
      {showAll && (
        <div
          style={modalOverlay}
          onClick={() => setShowAll(false)}
        >
          <div
            style={modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeader}>
              <div style={modalHeaderLeft}>
                <span style={{ fontSize: "28px" }}>🏷️</span>
                <div>
                  <h2 style={modalTitle}>All Categories</h2>
                  <p style={modalSubtitle}>
                    {categories.length} categories available
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAll(false)}
                style={closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={modalGrid}>
              <div
                onClick={() => {
                  setShowAll(false)
                  navigate("/")
                }}
                style={modalCardAll}
              >
                <span style={{ fontSize: "20px" }}>🏠</span>
                <span style={modalCardText}>All Products</span>
              </div>

              {categories.map((category) => (
                <div
                  key={category}
                  onClick={() => goToCategory(category)}
                  style={modalCard}
                >
                  <span style={{ fontSize: "20px" }}>📦</span>
                  <span style={modalCardText}>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ================= STYLES =================

const container = {
  background: "#ffffff",
  padding: "12px 30px",
  borderBottom: "1px solid #e2e8f0",
  position: "sticky" as const,
  top: 0,
  zIndex: 100,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
}

const categoriesWrapper = {
  display: "flex",
  flexWrap: "nowrap" as const,        // ✅ Ek hi line
  gap: "8px 12px",
  padding: "4px 0",
  maxWidth: "100%",
  margin: "0 auto",
  alignItems: "center",
  overflow: "hidden"                   // ✅ Height nahi badhegi
}

const categoryItem = {
  padding: "6px 16px",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  borderRadius: "50px",
  transition: "all 0.2s ease",
  border: "1px solid transparent",
  whiteSpace: "nowrap" as const,
  flexShrink: 0
}

const categoryItemAll = {
  ...categoryItem,
  background: "#2563eb",
  color: "#ffffff",
  border: "1px solid #2563eb"
}

const moreBtn = {
  ...categoryItem,
  background: "#8b5cf6",
  color: "#ffffff",
  border: "1px solid #8b5cf6",
  fontWeight: "600" as const,
  marginLeft: "4px",
  boxShadow: "0 2px 6px rgba(139, 92, 246, 0.25)"
}

// ============ MODAL STYLES ============
const modalOverlay = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(4px)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px"
}

const modalContent = {
  background: "white",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column" as const,
  boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
  overflow: "hidden"
}

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc"
}

const modalHeaderLeft = {
  display: "flex",
  alignItems: "center",
  gap: "14px"
}

const modalTitle = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: "#0f172a"
}

const modalSubtitle = {
  margin: "2px 0 0 0",
  fontSize: "13px",
  color: "#64748b"
}

const closeBtn = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  fontSize: "16px",
  cursor: "pointer",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "12px",
  padding: "20px 24px",
  overflowY: "auto" as const,
  flex: 1
}

const modalCard = {
  padding: "14px 16px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  transition: "all 0.2s ease"
}

const modalCardAll = {
  ...modalCard,
  background: "#2563eb",
  border: "1px solid #2563eb",
  color: "white"
}

const modalCardText = {
  fontSize: "14px",
  fontWeight: "600" as const,
  lineHeight: "1.3"
}

export default CategoriesBar