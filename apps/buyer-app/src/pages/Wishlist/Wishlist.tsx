// buyer-app/src/pages/Wishlist/Wishlist.tsx

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any>({ items: [] })
  const [loading, setLoading] = useState(true)
  const buyer = JSON.parse(localStorage.getItem("user") || "{}")
  const navigate = useNavigate()

  useEffect(() => {
    if (buyer._id) {
      fetchWishlist()
    }
  }, [buyer._id])

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_URL}/wishlist/${buyer._id}`)
      const data = await res.json()
      setWishlist(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string) => {
    await fetch(`${API_URL}/wishlist/remove/${buyer._id}/${productId}`, {
      method: "DELETE"
    })
    fetchWishlist()
  }

  const handleRFQ = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!buyer._id) {
      alert("Please login first")
      navigate("/login")
      return
    }
    navigate("/rfq-dashboard")
  }

  const goToProduct = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>❤️ My Wishlist</h1>
        <span style={styles.count}>{wishlist.items.length} items</span>
      </div>

      {wishlist.items.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>💔</span>
          <p style={styles.emptyText}>Your wishlist is empty</p>
          <p style={styles.emptySubtext}>Start adding products you love!</p>
          <button onClick={() => navigate("/")} style={styles.shopBtn}>🛍️ Browse Products</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {wishlist.items.map((item: any) => (
            <div key={item.productId} style={styles.card}>
              <div style={styles.imageWrapper} onClick={() => goToProduct(item.productId)}>
                <img
                  src={item.productImage}
                  alt={item.productName}
                  style={styles.image}
                />
              </div>
              <div style={styles.details}>
                <h3 style={styles.productName}>{item.productName}</h3>
                <p style={styles.price}>₹{item.price}</p>

                <div style={styles.buttonRow}>
                  <button
                    onClick={handleRFQ}
                    style={styles.rfqBtn}
                  >
                    📩 RFQ
                  </button>
                </div>

                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  style={styles.removeBtn}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    padding: "30px 20px",
    maxWidth: "1200px",
    margin: "auto",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
    gap: "10px"
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0f172a",
    background: "linear-gradient(135deg, #ec4899, #f472b6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  count: {
    padding: "4px 14px",
    background: "white",
    borderRadius: "20px",
    fontSize: "14px",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    fontWeight: "500"
  },
  loading: {
    textAlign: "center" as const,
    padding: "60px",
    fontSize: "18px",
    color: "#64748b"
  },
  empty: {
    textAlign: "center" as const,
    padding: "60px 20px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px"
  },
  emptyText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 8px 0"
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0 0 20px 0"
  },
  shopBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px"
  },
  card: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column" as const
  },
  imageWrapper: {
    cursor: "pointer",
    overflow: "hidden",
    position: "relative" as const,
    background: "#f8fafc"
  },
  image: {
    width: "100%",
    height: "200px",
    objectFit: "contain" as const,
    padding: "16px",
    transition: "transform 0.3s ease"
  },
  details: {
    padding: "16px 18px 18px",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px"
  },
  productName: {
    fontSize: "15px",
    fontWeight: "600",
    margin: 0,
    color: "#0f172a",
    lineHeight: "1.4"
  },
  price: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: "18px",
    margin: 0
  },
  buttonRow: {
    display: "flex",
    gap: "6px",
    marginTop: "4px",
    flexWrap: "wrap" as const
  },
  rfqBtn: {
    flex: 1,
    padding: "7px 10px",
    background: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  removeBtn: {
    padding: "7px 12px",
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    marginTop: "4px",
    transition: "all 0.2s ease"
  }
}

export default Wishlist