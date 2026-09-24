interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: string
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    <div style={cardStyle}>
      <div style={{ ...iconStyle, background: color }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
      </div>
      <div>
        <h3 style={valueStyle}>{value}</h3>
        <p style={titleStyle}>{title}</p>
      </div>
    </div>
  )
}

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  border: "1px solid #e2e8f0"
}

const iconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0
}

const valueStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "bold",
  color: "#0f172a"
}

const titleStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#64748b"
}

export default StatCard