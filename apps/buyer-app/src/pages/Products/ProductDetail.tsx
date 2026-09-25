import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import RFQModal from "../../components/RFQModal/RFQModal"
import { API_URL, BACKEND_URL } from "../../config"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState<any>(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [addingToWishlist, setAddingToWishlist] = useState(false)

  const [showRFQModal, setShowRFQModal] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`${API_URL}/products/${id}`)
      const data = await res.json()

      const updatedProduct = {
        ...data,
        image: data.image?.startsWith("http")
          ? data.image
          : `${BACKEND_URL}${data.image || ""}`,
        extraImages: (
          Array.isArray(data.extraImages)
            ? data.extraImages
            : Array.isArray(data.images)
              ? data.images
              : []
        ).map((img: string) =>
          img.startsWith("http") ? img : `${BACKEND_URL}${img}`
        )
      }

      setProduct(updatedProduct)

      if (updatedProduct.sellerId) {
        const res = await fetch(
          `${API_URL}/seller/profile/${updatedProduct.sellerId}`
        )
        const seller = await res.json()
        setCompanyProfile(seller)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    const fetchRelated = async () => {
      const res = await fetch(`${API_URL}/products`)
      const data = await res.json()

      const filtered = data
        .filter((p: any) => p._id !== id && p.category === product?.category)
        .slice(0, 20)

      setRelatedProducts(filtered)
    }

    if (product?.category) fetchRelated()
  }, [product, id])

  const addToWishlist = async () => {
    setAddingToWishlist(true)
    const buyer = JSON.parse(localStorage.getItem("user") || "{}")

    if (!buyer._id) {
      showToast("Please login first", "error")
      navigate("/login")
      setAddingToWishlist(false)
      return
    }

    try {
      await fetch(`${API_URL}/wishlist/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: buyer._id,
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          sellerId: product.sellerId
        })
      })
      showToast("❤️ Added to Wishlist!", "success")
    } catch (err) {
      showToast("❌ Failed to add to wishlist", "error")
    } finally {
      setAddingToWishlist(false)
    }
  }

  if (!product)
    return <div style={loadingStyle}>Loading product...</div>

  const allImages = [product.image, ...(product.extraImages || [])].filter(Boolean)

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        <div style={leftSide}>
          <div style={imageBox}>
            {product.moq > 0 && (
              <div style={moqFloatingBadge}>
                📦 MOQ: {product.moq}
              </div>
            )}

            <img src={allImages[currentImage]} style={mainImage} />

            {allImages.length > 1 && (
              <>
                <button onClick={() =>
                  setCurrentImage(p => p === 0 ? allImages.length - 1 : p - 1)
                } style={navBtn("left")}>‹</button>

                <button onClick={() =>
                  setCurrentImage(p => p === allImages.length - 1 ? 0 : p + 1)
                } style={navBtn("right")}>›</button>
              </>
            )}
          </div>

          <div style={thumbRow}>
            {allImages.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                onClick={() => setCurrentImage(i)}
                style={{
                  ...thumb,
                  border: currentImage === i ? "2px solid #8b5cf6" : "2px solid transparent",
                  boxShadow: currentImage === i
                    ? "0 8px 20px rgba(139, 92, 246, 0.35)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transform: currentImage === i ? "translateY(-3px)" : "translateY(0)"
                }}
              />
            ))}
          </div>

          <div style={sidebar}>
            <h3 style={sectionTitle}>🎯 Similar Products</h3>
            {relatedProducts.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No similar products</p>
            ) : (
              relatedProducts.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/product/${p._id}`)}
                  style={relatedCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)"
                    e.currentTarget.style.borderColor = "#8b5cf6"
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(139, 92, 246, 0.2)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)"
                    e.currentTarget.style.borderColor = "#e5e7eb"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                >
                  <img src={p.image} style={thumbImg} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={relatedName}>{p.name}</p>
                    <b style={relatedPrice}>₹{p.price}</b>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={rightContent}>
          <div style={infoBox}>
            <h1 style={title}>{product.name}</h1>
            <p style={subText}>🏢 {product.company || "N/A"}</p>

            <div style={badgeContainer}>
              {companyProfile?.gstNumber && (
                <span style={verifiedBadge}>✅ GST Verified</span>
              )}
              {companyProfile?.kycStatus === "Verified" && (
                <span style={verifiedBadge}>⭐ Trusted Seller</span>
              )}
              {companyProfile?.isDistributor && (
                <span style={verifiedBadge}>🏭 Authorized Distributor</span>
              )}
            </div>

            <div style={priceTagWrapper}>
              <span style={price}>₹{product.price}</span>
              <span style={priceUnit}>/ unit</span>
            </div>

            <div style={btnRow}>
              <button
                style={wishlistBtn}
                onClick={addToWishlist}
                disabled={addingToWishlist}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(239, 68, 68, 0.45)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.3)"
                }}
              >
                {addingToWishlist ? "Adding..." : "❤️ Add to Wishlist"}
              </button>

              <button
                style={rfqBtn}
                onClick={() => setShowRFQModal(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(236, 72, 153, 0.5)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(236, 72, 153, 0.35)"
                }}
              >
                📩 Request Quote (RFQ)
              </button>
            </div>

            <div style={metaGrid}>
              <div style={metaItem}>
                <span style={metaLabel}>📂 Category</span>
                <span style={metaValue}>{product.category || "N/A"}</span>
              </div>
              <div style={metaItem}>
                <span style={metaLabel}>📦 Stock</span>
                <span
                  style={{
                    ...metaValue,
                    color: Number(product.stock) > 0 ? "#16a34a" : "#dc2626"
                  }}
                >
                  {product.stock} units
                </span>
              </div>
              {product.moq > 0 && (
                <div style={metaItem}>
                  <span style={metaLabel}>⚡ MOQ</span>
                  <span style={metaValue}>{product.moq} units</span>
                </div>
              )}
            </div>

            {product.bulkPricing && product.bulkPricing.length > 0 && (
              <div style={bulkPricingBox}>
                <h4 style={bulkTitle}>💰 Bulk Pricing (per unit)</h4>
                {product.bulkPricing.map((tier: any, idx: number) => (
                  <div key={idx} style={bulkRow}>
                    <span style={bulkQty}>Buy {tier.quantity}+</span>
                    <span style={bulkPrice}>₹{tier.price}</span>
                  </div>
                ))}
                <p style={bulkNote}>*Contact seller for higher quantities</p>
              </div>
            )}

            <div style={card}>
              <h3 style={cardTitle}>📝 Product Details</h3>
              <p style={cardText}>{product.details}</p>
            </div>

            {product.extraFields?.length > 0 && (
              <div style={card}>
                <h3 style={cardTitle}>📋 Extra Information</h3>
                {product.extraFields.map((f: any, i: number) => (
                  <div key={i} style={extraFieldItem}>
                    <b style={extraFieldTitle}>{f.title}</b>
                    <p style={extraFieldText}>{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={distributorSide}>
            <h3 style={sectionTitle}>🏭 Distributor Information</h3>
            {companyProfile && (
              <div style={distributorGrid}>
                <InfoRow icon="🏢" label="Company" value={companyProfile.companyName} />
                <InfoRow icon="📧" label="Email" value={companyProfile.email} />
                <InfoRow icon="📞" label="Phone" value={companyProfile.phone} />
                <InfoRow icon="🧾" label="GST" value={companyProfile.gstNumber} />
                <InfoRow icon="📅" label="Years" value={companyProfile.yearsInBusiness} />
                <InfoRow icon="✅" label="KYC" value={companyProfile.kycStatus} />
                <InfoRow icon="💳" label="PAN" value={companyProfile.panNumber} />
                <InfoRow icon="📋" label="Business Reg" value={companyProfile.businessRegNumber} />
                <InfoRow icon="📍" label="Address" value={companyProfile.address} />
                <InfoRow icon="📝" label="Description" value={companyProfile.storeDescription} />
                <InfoRow
                  icon="🏭"
                  label="Distributor"
                  value={companyProfile.isDistributor ? "Yes ✅" : "No"}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showRFQModal && (
        <RFQModal
          isOpen={showRFQModal}
          onClose={() => setShowRFQModal(false)}
          cartItems={[{
            productId: product._id,
            productName: product.name,
            productImage: product.image,
            quantity: 1,
            price: product.price,
            sellerId: product.sellerId
          }]}
          sellerId={product.sellerId}
          sellerName={product.company || "Seller"}
          buyerId={user._id || "guest"}
          buyerName={user.name || "Buyer"}
          totalAmount={Number(product.price)}
          moq={product.moq || 1}
          maxStock={product.stock || 999999}
        />
      )}

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

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const InfoRow = ({ icon, label, value }: any) => {
  if (!value) return null
  return (
    <div style={infoRow}>
      <span style={infoIcon}>{icon}</span>
      <span style={infoLabel}>{label}</span>
      <span style={infoValue}>{value}</span>
    </div>
  )
}

// ================= STYLES =================

const pageStyle: React.CSSProperties = {
  padding: "32px 24px",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e0e7ff 0%, #ede9fe 30%, #fae8ff 70%, #fce7f3 100%)",
  backgroundAttachment: "fixed",
  fontFamily: "'Inter', 'Segoe UI', sans-serif"
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  gap: "32px",
  maxWidth: 1350,
  margin: "auto",
  alignItems: "flex-start"
}

const leftSide: React.CSSProperties = {
  flex: 3,
  minWidth: 300,
  position: "sticky",
  top: 90,
  alignSelf: "flex-start",
  maxHeight: "calc(100vh - 120px)",
  overflowY: "auto",
  animation: "fadeInUp 0.4s ease"
}

const rightContent: React.CSSProperties = {
  flex: 3,
  minWidth: 300,
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  animation: "fadeInUp 0.5s ease"
}

const sidebar: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 10px 40px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(139, 92, 246, 0.06)",
  border: "1px solid #ede9fe",
  marginTop: "20px"
}

const distributorSide: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 10px 40px rgba(34, 197, 94, 0.08), 0 2px 8px rgba(34, 197, 94, 0.04)",
  border: "1px solid #dcfce7"
}

const imageBox: React.CSSProperties = {
  position: "relative",
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f5f3ff 100%)",
  padding: "28px",
  borderRadius: "24px",
  boxShadow: "0 20px 60px rgba(99, 102, 241, 0.12), 0 4px 12px rgba(139, 92, 246, 0.08)",
  border: "1px solid #ede9fe",
  overflow: "hidden"
}

const moqFloatingBadge: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  left: "20px",
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "white",
  padding: "8px 16px",
  borderRadius: "24px",
  fontSize: "12px",
  fontWeight: "800",
  zIndex: 3,
  boxShadow: "0 8px 24px rgba(245, 158, 11, 0.5)",
  letterSpacing: "0.3px"
}

const mainImage: React.CSSProperties = {
  width: "100%",
  height: 440,
  objectFit: "contain",
  borderRadius: "16px",
  transition: "transform 0.4s ease"
}

const thumbRow: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "18px",
  overflowX: "auto",
  padding: "4px"
}

const thumb: React.CSSProperties = {
  width: 72,
  height: 72,
  objectFit: "cover",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  background: "white",
  flexShrink: 0
}

const infoBox: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #fafbff 50%, #f5f3ff 100%)",
  padding: "32px",
  borderRadius: "24px",
  boxShadow: "0 20px 60px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(139, 92, 246, 0.06)",
  border: "1px solid #ede9fe"
}

const title: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  marginBottom: "10px",
  letterSpacing: "-0.8px",
  lineHeight: "1.25"
}

const subText: React.CSSProperties = {
  color: "#64748b",
  fontSize: "15px",
  margin: 0,
  fontWeight: "600"
}

const badgeContainer: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "16px",
  marginBottom: "22px"
}

const verifiedBadge: React.CSSProperties = {
  background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
  color: "#166534",
  padding: "7px 14px",
  borderRadius: "24px",
  fontSize: "11px",
  fontWeight: "800",
  border: "1px solid #86efac",
  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.15)",
  letterSpacing: "0.3px"
}

const priceTagWrapper: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "10px",
  marginTop: "10px",
  marginBottom: "22px",
  padding: "18px 26px",
  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
  borderRadius: "18px",
  border: "1px solid #86efac",
  width: "fit-content",
  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.18)"
}

const price: React.CSSProperties = {
  fontSize: "38px",
  fontWeight: "900",
  color: "#15803d",
  letterSpacing: "-1px"
}

const priceUnit: React.CSSProperties = {
  fontSize: "15px",
  color: "#16a34a",
  fontWeight: "700"
}

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "10px",
  marginBottom: "24px",
  flexWrap: "wrap"
}

const wishlistBtn: React.CSSProperties = {
  padding: "16px 28px",
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  letterSpacing: "0.3px"
}

const rfqBtn: React.CSSProperties = {
  padding: "16px 28px",
  background: "linear-gradient(135deg, #ec4899, #be185d)",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "15px",
  boxShadow: "0 8px 24px rgba(236, 72, 153, 0.4)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  letterSpacing: "0.3px"
}

const metaGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginTop: "10px",
  marginBottom: "20px"
}

const metaItem: React.CSSProperties = {
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  padding: "16px 18px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  transition: "all 0.2s ease"
}

const metaLabel: React.CSSProperties = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.8px"
}

const metaValue: React.CSSProperties = {
  fontSize: "15px",
  color: "#0f172a",
  fontWeight: "800"
}

const bulkPricingBox: React.CSSProperties = {
  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
  padding: "22px",
  borderRadius: "18px",
  marginTop: "20px",
  border: "1px solid #fcd34d",
  boxShadow: "0 8px 24px rgba(251, 191, 36, 0.18)"
}

const bulkTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: "14px",
  fontSize: "15px",
  fontWeight: "800",
  color: "#78350f",
  letterSpacing: "-0.2px"
}

const bulkRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 14px",
  borderBottom: "1px dashed #fbbf24",
  background: "rgba(255,255,255,0.65)",
  borderRadius: "10px",
  marginBottom: "6px"
}

const bulkQty: React.CSSProperties = {
  fontSize: "14px",
  color: "#78350f",
  fontWeight: "700"
}

const bulkPrice: React.CSSProperties = {
  fontWeight: "900",
  color: "#15803d",
  fontSize: "16px"
}

const bulkNote: React.CSSProperties = {
  fontSize: "11px",
  color: "#92400e",
  marginTop: "12px",
  marginBottom: 0,
  fontStyle: "italic",
  fontWeight: "600"
}

const card: React.CSSProperties = {
  marginTop: "20px",
  padding: "22px",
  background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)"
}

const cardTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: "12px",
  fontSize: "16px",
  fontWeight: "800",
  color: "#0f172a",
  letterSpacing: "-0.2px"
}

const cardText: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.7"
}

const extraFieldItem: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9"
}

const extraFieldTitle: React.CSSProperties = {
  fontSize: "14px",
  color: "#0f172a",
  display: "block",
  marginBottom: "5px",
  fontWeight: "700"
}

const extraFieldText: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
  lineHeight: "1.6"
}

const sectionTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: "18px",
  fontSize: "18px",
  fontWeight: "800",
  color: "#0f172a",
  letterSpacing: "-0.4px"
}

const distributorGrid: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
}

const infoRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)",
  borderRadius: "12px",
  border: "1px solid #dcfce7",
  transition: "all 0.2s ease"
}

const infoIcon: React.CSSProperties = {
  fontSize: "16px",
  flexShrink: 0
}

const infoLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "700",
  minWidth: "100px"
}

const infoValue: React.CSSProperties = {
  fontSize: "13px",
  color: "#0f172a",
  fontWeight: "700",
  flex: 1,
  wordBreak: "break-word"
}

const relatedCard: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  padding: "12px",
  borderRadius: "14px",
  cursor: "pointer",
  border: "1px solid #e5e7eb",
  marginBottom: "12px",
  background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  alignItems: "center"
}

const thumbImg: React.CSSProperties = {
  width: 58,
  height: 58,
  objectFit: "cover",
  borderRadius: "12px",
  flexShrink: 0
}

const relatedName: React.CSSProperties = {
  fontSize: "13px",
  color: "#0f172a",
  margin: 0,
  marginBottom: "5px",
  fontWeight: "700",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const relatedPrice: React.CSSProperties = {
  fontSize: "15px",
  color: "#16a34a",
  fontWeight: "900"
}

const navBtn = (side: "left" | "right") => ({
  position: "absolute" as const,
  top: "50%",
  [side]: 16,
  transform: "translateY(-50%)",
  background: "rgba(15, 23, 42, 0.85)",
  color: "#fff",
  border: "none",
  width: 46,
  height: 46,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "22px",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.25s ease",
  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
  backdropFilter: "blur(10px)"
})

const loadingStyle: React.CSSProperties = {
  padding: "120px 40px",
  textAlign: "center",
  fontSize: "17px",
  color: "#64748b",
  fontWeight: "600"
}

const toastStyle: React.CSSProperties = {
  position: "fixed",
  top: 24,
  right: 24,
  padding: "16px 22px",
  borderRadius: "14px",
  boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: 14,
  fontWeight: 600,
  zIndex: 99999,
  animation: "slideInRight 0.3s ease",
  minWidth: 240
}

export default ProductDetail