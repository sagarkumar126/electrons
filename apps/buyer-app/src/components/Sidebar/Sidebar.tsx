import { categories } from "../../constants/categories"
import { useNavigate, useLocation } from "react-router-dom"

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const activeCategory = decodeURIComponent(
    location.pathname.split("/category/")[1] || ""
  )

  return (
    <div style={{
      width: "260px",
      background: "#111",
      color: "white",
      height: "100vh",
      padding: "15px",
      overflowY: "auto"
    }}>

      <h2 style={{ marginBottom: "20px" }}>
        Categories
      </h2>

      <div
        onClick={() => navigate("/")}
        style={{
          padding: "12px",
          marginBottom: "10px",
          cursor: "pointer",
          borderRadius: "6px",
          background: "#222"
        }}
      >
        All Products
      </div>

      {categories.map((cat, i) => {
        const isActive = activeCategory === cat

        return (
          <div
            key={i}
            onClick={() => navigate(`/category/${encodeURIComponent(cat)}`)}
            style={{
              padding: "12px",
              marginBottom: "5px",
              cursor: "pointer",
              borderRadius: "6px",
              transition: "0.3s",
              background: isActive ? "#444" : "transparent",
              borderLeft: isActive ? "4px solid orange" : "4px solid transparent"
            }}
          >
            {cat}
          </div>
        )
      })}

    </div>
  )
}

export default Sidebar