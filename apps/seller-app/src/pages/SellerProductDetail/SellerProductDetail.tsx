import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

const SellerProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [companyProfile, setCompanyProfile] = useState<any>(null)

  // ✅ NEW: Photo editor state
  const [photoEditProduct, setPhotoEditProduct] = useState<any>(null)
  const [photoEditImages, setPhotoEditImages] = useState<any[]>([])

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`)
      const data = await res.json()

      const updatedProduct = {
        ...data,
        image: data.image?.startsWith("http")
          ? data.image
          : `http://localhost:5000${data.image || ""}`,
        extraImages: (
          Array.isArray(data.extraImages)
            ? data.extraImages
            : Array.isArray(data.images)
              ? data.images
              : []
        ).map((img: string) =>
          img.startsWith("http") ? img : `http://localhost:5000${img}`
        )
      }

      setProduct(updatedProduct)

      // Fetch seller profile for badges
      if (updatedProduct.sellerId) {
        const sellerRes = await fetch(
          `http://localhost:5000/api/seller/profile/${updatedProduct.sellerId}`
        )
        const sellerData = await sellerRes.json()
        setCompanyProfile(sellerData)
      }

    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Delete product
  const deleteProduct = async () => {
    if (!product) return
    const confirmDelete = window.confirm(`Delete "${product.name}"?`)
    if (!confirmDelete) return

    try {
      await fetch(`http://localhost:5000/api/products/${product._id}`, {
        method: "DELETE"
      })
      alert("✅ Product deleted!")
      navigate("/all-products")
    } catch (error) {
      alert("❌ Failed to delete product")
    }
  }

  // ✅ NEW: Open photo editor
  const openPhotoEditor = () => {
    setPhotoEditProduct(product)
    setPhotoEditImages(product.images || [product.image].filter(Boolean))
  }

  // ✅ NEW: Remove a photo
  const removePhoto = (index: number) => {
    const updated = [...photoEditImages]
    updated.splice(index, 1)
    setPhotoEditImages(updated)
  }

  // ✅ NEW: Save photos
  const savePhotos = async () => {
    if (!photoEditProduct) return
    const updatedProduct = {
      ...photoEditProduct,
      images: photoEditImages,
      image: photoEditImages[0] || ""
    }
    delete updatedProduct._id

    try {
      await fetch(`http://localhost:5000/api/products/${photoEditProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct)
      })
      alert("✅ Photos updated!")
      setPhotoEditProduct(null)
      setPhotoEditImages([])
      fetchProduct()
    } catch (error) {
      alert("❌ Failed to update photos")
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
  }

  if (!product) {
    return <div style={{ padding: 40, textAlign: "center" }}>Product not found</div>
  }

  const allImages = [product.image, ...(product.extraImages || [])].filter(Boolean)

  return (
    <div style={pageStyle}>
      <button
        onClick={() => navigate("/all-products")}
        style={backBtn}
      >
        ← Back to All Products
      </button>

      <div style={containerStyle}>
        {/* LEFT SIDE - Sticky Image */}
        <div style={leftSide}>
          <div style={imageBox}>
            <img src={allImages[currentImage]} style={mainImage} />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage(p => p === 0 ? allImages.length - 1 : p - 1)}
                  style={navBtn("left")}
                >
                  ‹
                </button>
                <button
                  onClick={() => setCurrentImage(p => p === allImages.length - 1 ? 0 : p + 1)}
                  style={navBtn("right")}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {allImages.length > 1 && (
            <div style={thumbRow}>
              {allImages.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setCurrentImage(i)}
                  style={{
                    ...thumb,
                    border: currentImage === i ? "2px solid #2563eb" : "1px solid #ddd"
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Product Details */}
        <div style={rightContent}>
          <div style={infoBox}>
            <h1 style={title}>{product.name}</h1>
            <p style={subText}><b>Company:</b> {product.company || "N/A"}</p>

            {/* Seller Verification Badges */}
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

            <p style={price}>₹{product.price}</p>

            <p><b>Category:</b> {product.category}</p>
            {product.subCategory && (
              <p><b>Sub-Category:</b> {product.subCategory}</p>
            )}
            <p><b>Stock:</b> {product.stock}</p>

            {product.moq > 0 && (
              <p style={moqStyle}>
                📦 Minimum Order Quantity: <strong>{product.moq} units</strong>
              </p>
            )}

            {product.bulkPricing && product.bulkPricing.length > 0 && (
              <div style={bulkPricingBox}>
                <h4>Bulk Pricing (per unit)</h4>
                {product.bulkPricing.map((tier: any, idx: number) => (
                  <div key={idx} style={bulkRow}>
                    <span>Buy {tier.quantity}+</span>
                    <span style={bulkPrice}>₹{tier.price}</span>
                  </div>
                ))}
                <p style={bulkNote}>*Contact seller for higher quantities</p>
              </div>
            )}

            <div style={card}>
              <h3>Details</h3>
              <p>{product.details}</p>
            </div>

            {product.extraFields?.length > 0 && (
              <div style={card}>
                <h3>Extra Information</h3>
                {product.extraFields.map((f: any, i: number) => (
                  <div key={i}>
                    <b>{f.title}</b>
                    <p>{f.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ✅ Action Buttons - Updated */}
            <div style={btnRow}>
              <button
                onClick={() => navigate(`/products?editId=${product._id}`)}
                style={editBtn}
              >
                ✏️ Edit Product
              </button>
              <button
                onClick={openPhotoEditor}
                style={photoBtn}
              >
                📸 Manage Photos
              </button>
              <button
                onClick={deleteProduct}
                style={deleteBtn}
              >
                🗑️ Delete Product
              </button>
              <button
                onClick={() => navigate("/all-products")}
                style={backBtn2}
              >
                📦 All Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: PHOTO EDITOR MODAL */}
      {photoEditProduct && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginTop: 0 }}>📸 Manage Photos</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 0 }}>
              Remove photos you don't want to show. First photo becomes the main image.
            </p>

            {photoEditImages.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                No photos available
              </p>
            )}

            {photoEditImages.map((img, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  alignItems: "center",
                  padding: "8px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: index === 0 ? "2px solid #22c55e" : "1px solid #e2e8f0"
                }}
              >
                <img
                  src={img}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: "600", color: "#0f172a" }}>
                    {index === 0 ? "⭐ Main Photo" : `Photo ${index + 1}`}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                    {img.split("/").pop()?.slice(0, 30) || ""}
                  </p>
                </div>
                <button
                  onClick={() => removePhoto(index)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 12
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            ))}

            <div style={{ marginTop: "18px", display: "flex", gap: "10px" }}>
              <button
                onClick={savePhotos}
                style={{
                  flex: 1,
                  background: "#16a34a",
                  color: "white",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ✅ Save Changes
              </button>
              <button
                onClick={() => setPhotoEditProduct(null)}
                style={{
                  flex: 1,
                  background: "#6b7280",
                  color: "white",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= STYLES =================

const pageStyle = {
  padding: 20,
  minHeight: "100vh",
  background: "linear-gradient(135deg,#eef2ff,#f8fafc)"
}

const backBtn = {
  padding: "8px 16px",
  background: "none",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  marginBottom: "20px",
  color: "#1e293b"
}

const containerStyle = {
  display: "flex",
  gap: 40,
  maxWidth: 1350,
  margin: "auto",
  alignItems: "flex-start" as const
}

const leftSide = {
  flex: 3,
  minWidth: 300,
  position: "sticky" as const,
  top: 80,
  alignSelf: "flex-start" as const,
  maxHeight: "calc(100vh - 100px)",
  overflowY: "auto" as const
}

const rightContent = {
  flex: 3,
  minWidth: 300,
  display: "flex",
  flexDirection: "column" as const,
  gap: 20
}

const imageBox = {
  position: "relative" as const,
  background: "#fff",
  padding: 15,
  borderRadius: 16,
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)"
}

const mainImage = {
  width: "100%",
  height: 380,
  objectFit: "contain" as const,
  borderRadius: 12
}

const thumbRow = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  overflowX: "auto" as const
}

const thumb = {
  width: 65,
  height: 65,
  objectFit: "cover" as const,
  borderRadius: 8,
  cursor: "pointer"
}

const infoBox = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
}

const title = {
  fontSize: 28,
  marginBottom: 5,
  color: "#0f172a"
}

const subText = {
  color: "#555",
  marginBottom: 4
}

const badgeContainer = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
  marginTop: 10,
  marginBottom: 10
}

const verifiedBadge = {
  background: "#dcfce7",
  color: "#166534",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "bold" as const
}

const price = {
  fontSize: 26,
  fontWeight: "bold",
  color: "#16a34a",
  marginBottom: 10
}

const moqStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "8px 12px",
  borderRadius: 8,
  marginTop: 10,
  fontSize: 14
}

const bulkPricingBox = {
  background: "#f3f4f6",
  padding: 12,
  borderRadius: 10,
  marginTop: 10
}

const bulkRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #e5e7eb"
}

const bulkPrice = {
  fontWeight: "bold" as const,
  color: "#16a34a"
}

const bulkNote = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 8,
  marginBottom: 0
}

const card = {
  marginTop: 15,
  padding: 15,
  background: "#f9fafb",
  borderRadius: 12,
  border: "1px solid #e5e7eb"
}

const btnRow = {
  display: "flex",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap" as const
}

const editBtn = {
  padding: "10px 20px",
  background: "#7c3aed",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
}

// ✅ NEW: Photos button
const photoBtn = {
  padding: "10px 20px",
  background: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
}

// ✅ NEW: Delete button
const deleteBtn = {
  padding: "10px 20px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
}

const backBtn2 = {
  padding: "10px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: "bold"
}

const navBtn = (side: "left" | "right") => ({
  position: "absolute" as const,
  top: "50%",
  [side]: 10,
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  border: "none",
  width: 36,
  height: 36,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: 18
})

// ✅ NEW: Modal styles
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
  padding: "24px",
  borderRadius: "16px",
  width: "460px",
  maxWidth: "90%",
  maxHeight: "85vh",
  overflowY: "auto" as const
}

export default SellerProductDetail