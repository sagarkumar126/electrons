import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { API_URL } from "../../config"

const SellerStore = () => {
  const { sellerId } = useParams()
  const [seller, setSeller] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSellerData()
  }, [sellerId])

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const sellerRes = await fetch(`${API_URL}/seller/profile/${sellerId}`)
      const sellerData = await sellerRes.json()
      setSeller(sellerData)

      // Fetch seller products
      const productsRes = await fetch(`${API_URL}/products/seller/${sellerId}`)
      const productsData = await productsRes.json()
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching seller data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading seller store...</div>
  if (!seller) return <div>Seller not found</div>

  return (
    <div style={container}>
      {/* Seller Header */}
      <div style={header}>
        <div>
          <h1>{seller.companyName || seller.name}</h1>
          <p>{seller.address || "No address provided"}</p>
          <p>⭐ 4.5 (120 reviews) | ✅ {seller.kycStatus === "Verified" ? "Verified Seller" : "Pending Verification"}</p>
        </div>
        <div style={stats}>
          <div style={statCard}>
            <span>{products.length}</span>
            <span>Products</span>
          </div>
          <div style={statCard}>
            <span>4.5</span>
            <span>Rating</span>
          </div>
          <div style={statCard}>
            <span>2h</span>
            <span>Response Time</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div style={grid}>
        {products.map((product) => (
          <div key={product._id} style={card}>
            <img src={product.image} alt={product.name} style={image} />
            <h3>{product.name}</h3>
            <p>₹{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const container = { padding: 20, maxWidth: 1200, margin: "auto" }
const header = { background: "white", padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
const stats = { display: "flex", gap: 20, marginTop: 15 }
const statCard = { textAlign: "center" as const, padding: "10px 20px", background: "#f8fafc", borderRadius: 8 }
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }
const card = { background: "white", padding: 15, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
const image = { width: "100%", height: 150, objectFit: "cover" as const, borderRadius: 8 }

export default SellerStore