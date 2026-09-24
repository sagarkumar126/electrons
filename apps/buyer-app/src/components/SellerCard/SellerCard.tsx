import { useNavigate } from "react-router-dom"

interface SellerCardProps {
  sellerId: string
  companyName: string
  email: string
  phone: string
  rating?: number
  reviews?: number
  isVerified?: boolean
  responseTime?: string
}

const SellerCard = ({
  sellerId,
  companyName,
  email,
  phone,
  rating = 0,
  reviews = 0,
  isVerified = false,
  responseTime = "N/A"
}: SellerCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/seller/${sellerId}`)
  }

  return (
    <div style={card} onClick={handleClick}>
      <div style={header}>
        <h3 style={name}>{companyName}</h3>
        {isVerified && <span style={verifiedBadge}>✅ Verified</span>}
      </div>
      
      <div style={details}>
        <p>📧 {email}</p>
        <p>📞 {phone}</p>
        <p>⏱️ Response: {responseTime}</p>
      </div>

      <div style={footer}>
        <span style={ratingBadge}>⭐ {rating.toFixed(1)}</span>
        <span style={reviewCount}>({reviews} reviews)</span>
      </div>
    </div>
  )
}

const card = {
  background: "white",
  padding: 16,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "0.2s",
  border: "1px solid #eee",
  marginBottom: 12
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
}

const name = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600
}

const verifiedBadge = {
  background: "#dcfce7",
  color: "#166534",
  padding: "2px 10px",
  borderRadius: 12,
  fontSize: 11,
  fontWeight: "bold"
}

const details = {
  fontSize: 13,
  color: "#666",
  marginBottom: 10
}

const footer = {
  display: "flex",
  alignItems: "center",
  gap: 8
}

const ratingBadge = {
  background: "#f59e0b",
  color: "white",
  padding: "2px 10px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: "bold"
}

const reviewCount = {
  fontSize: 12,
  color: "#666"
}

export default SellerCard