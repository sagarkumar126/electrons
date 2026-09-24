import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { auth, googleProvider } from "../../firebase"
import { signInWithPopup } from "firebase/auth"

const Login = () => {
  const navigate = useNavigate()
  const { adminGoogleLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      console.log("🔵 Trying to sign in with Google...")
      const result = await signInWithPopup(auth, googleProvider)
      console.log("✅ Sign in successful:", result)
      
      const { email, displayName, photoURL } = result.user
      console.log("📧 Email:", email)
      console.log("👤 Name:", displayName)

      if (!email) {
        setError("No email found")
        setLoading(false)
        return
      }

      console.log("🔵 Calling adminGoogleLogin API...")
      const response = await adminGoogleLogin(email, displayName || "Admin", photoURL || undefined)
      console.log("✅ API Response:", response)

      if (response?.payload?.success) {
        console.log("✅ Login successful, navigating to dashboard...")
        navigate("/dashboard")
      } else {
        console.log("❌ API returned error")
        setError("Login failed. Please try again.")
      }
    } catch (err: any) {
      console.error("❌ Login error:", err)
      console.error("Error code:", err.code)
      console.error("Error message:", err.message)
      
      if (err.code === "auth/popup-blocked") {
        setError("Popup blocked! Please allow popups for this site.")
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Login cancelled. Please try again.")
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Domain not authorized. Please contact admin.")
      } else if (err.code === "ERR_BAD_REQUEST" || err.code === "ERR_NETWORK") {
        setError("Backend server not responding. Please make sure main-server is running.")
      } else {
        setError(err.message || "Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={container}>
      <div style={box}>
        <div style={header}>
          <h1 style={title}>⚡ Admin Panel</h1>
          <p style={subtitle}>Electrons B2B Marketplace</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={googleBtn}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={googleIcon} 
          />
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

        {error && <p style={errorStyle}>{error}</p>}

        <p style={footerText}>
          Only authorized admins can access this panel
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

const footerText = {
  marginTop: "20px",
  fontSize: "12px",
  color: "#94a3b8"
}

export default Login