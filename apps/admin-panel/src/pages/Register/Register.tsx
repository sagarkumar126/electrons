 
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { auth, googleProvider } from "../../firebase"
import { signInWithPopup } from "firebase/auth"

const Register = () => {
  const navigate = useNavigate()
  const { adminGoogleLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleRegister = async () => {
    setError("")
    setLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const { email, displayName, photoURL } = result.user

      if (!email) {
        setError("No email found")
        setLoading(false)
        return
      }

      await adminGoogleLogin(email, displayName || "Admin", photoURL || undefined)
      navigate("/dashboard")
    } catch (err: any) {
      console.error("Register error:", err)
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div style={box}>
        <div style={header}>
          <h1 style={title}>⚡ Admin Register</h1>
          <p style={subtitle}>Create your admin account</p>
        </div>

        <button
          onClick={handleGoogleRegister}
          disabled={loading}
          style={googleBtn}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={googleIcon} 
          />
          {loading ? "Please wait..." : "Register with Google"}
        </button>

        {error && <p style={errorStyle}>{error}</p>}

        <p style={footerText}>
          Already have an account? <span style={linkStyle} onClick={() => navigate("/login")}>Login here</span>
        </p>
      </div>
    </div>
  )
}

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f172a, #1e293b)"
}

const box = {
  background: "white",
  padding: "40px",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  width: "400px",
  maxWidth: "90%",
  textAlign: "center" as const
}

const header = {
  marginBottom: "30px"
}

const title = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: 0
}

const subtitle = {
  fontSize: "14px",
  color: "#64748b",
  marginTop: "8px"
}

const googleBtn = {
  width: "100%",
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "white",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  transition: "all 0.2s ease"
}

const googleIcon = {
  width: "20px",
  height: "20px"
}

const errorStyle = {
  color: "#ef4444",
  marginTop: "16px",
  fontSize: "14px"
}

const linkStyle = {
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: "500"
}

const footerText = {
  marginTop: "20px",
  fontSize: "14px",
  color: "#64748b"
}

export default Register