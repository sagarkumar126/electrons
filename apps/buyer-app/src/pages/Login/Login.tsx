import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "../../firebase"

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message)
        return
      }

      localStorage.setItem("token", data.accessToken)
      localStorage.setItem("user", JSON.stringify(data.user))

      window.location.href = "/"

    } catch (err: any) {
      alert(err.message || "Login Failed")
    }
  }

  return (
    <div style={pageContainer}>
      {/* Background Orbs */}
      <div style={orb1}></div>
      <div style={orb2}></div>
      <div style={orb3}></div>

      {/* Floating shapes */}
      <div style={floatingShape1}></div>
      <div style={floatingShape2}></div>

      <div style={card}>
        {/* Logo */}
        <div style={logoSection}>
          <div style={logoIcon}>⚡</div>
          <h1 style={brandText}>yourElectronics</h1>
        </div>

        <h1 style={welcomeTitle}>Login 👋</h1>

        <p style={welcomeSubtitle}>
          Sign in with Google to continue shopping
        </p>

        <button
          onClick={handleGoogleLogin}
          style={googleBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 12px 30px rgba(66, 133, 244, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(66, 133, 244, 0.25)"
          }}
        >
          <span style={googleIconWrapper}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.6 0-10.3-3.6-12-8.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
          </span>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={divider}>
          <span style={dividerLine}></span>
          <span style={dividerText}>secure & fast</span>
          <span style={dividerLine}></span>
        </div>

        {/* Info Box */}
        <div style={infoBox}>
          <span style={infoIcon}>🔒</span>
          <p style={infoText}>
            Your data is protected with Google's secure authentication. We never store passwords.
          </p>
        </div>
      </div>

      {/* Bottom tagline */}
      <p style={tagline}>
        Trusted by 10,000+ businesses across India 🇮🇳
      </p>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-20px) rotate(45deg); }
        }
      `}</style>
    </div>
  )
}

// ================= STYLES =================

const pageContainer: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)",
  padding: "40px 20px",
  position: "relative",
  overflow: "hidden"
}

const orb1: React.CSSProperties = {
  position: "absolute",
  top: "-150px",
  right: "-100px",
  width: "450px",
  height: "450px",
  background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
  borderRadius: "50%",
  pointerEvents: "none"
}

const orb2: React.CSSProperties = {
  position: "absolute",
  bottom: "-200px",
  left: "-150px",
  width: "500px",
  height: "500px",
  background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)",
  borderRadius: "50%",
  pointerEvents: "none"
}

const orb3: React.CSSProperties = {
  position: "absolute",
  top: "40%",
  left: "60%",
  width: "300px",
  height: "300px",
  background: "radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)",
  borderRadius: "50%",
  pointerEvents: "none"
}

const floatingShape1: React.CSSProperties = {
  position: "absolute",
  top: "15%",
  left: "10%",
  width: "60px",
  height: "60px",
  border: "2px solid rgba(139, 92, 246, 0.3)",
  borderRadius: "14px",
  transform: "rotate(45deg)",
  pointerEvents: "none",
  animation: "float 6s ease-in-out infinite"
}

const floatingShape2: React.CSSProperties = {
  position: "absolute",
  bottom: "20%",
  right: "12%",
  width: "80px",
  height: "80px",
  border: "2px solid rgba(56, 189, 248, 0.25)",
  borderRadius: "50%",
  pointerEvents: "none",
  animation: "float 8s ease-in-out infinite reverse"
}

const card: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.98)",
  backdropFilter: "blur(20px)",
  padding: "48px 40px",
  borderRadius: "28px",
  width: "100%",
  maxWidth: "460px",
  boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
  position: "relative",
  zIndex: 2,
  animation: "slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
}

const logoSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "28px"
}

const logoIcon: React.CSSProperties = {
  fontSize: "32px",
  filter: "drop-shadow(0 4px 12px rgba(139, 92, 246, 0.6))"
}

const brandText: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "-0.5px",
  background: "linear-gradient(135deg, #8b5cf6, #4c1d95)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
}

const welcomeTitle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  marginBottom: "8px",
  textAlign: "center",
  letterSpacing: "-0.5px"
}

const welcomeSubtitle: React.CSSProperties = {
  fontSize: "14px",
  color: "#64748b",
  margin: 0,
  marginBottom: "32px",
  textAlign: "center",
  lineHeight: "1.5"
}

const googleBtn: React.CSSProperties = {
  width: "100%",
  padding: "16px 20px",
  borderRadius: "14px",
  border: "2px solid #e2e8f0",
  background: "white",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  transition: "all 0.3s ease",
  boxShadow: "0 6px 20px rgba(66, 133, 244, 0.25)"
}

const googleIconWrapper: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "24px",
  height: "24px"
}

const divider: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "28px 0 20px 0"
}

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: "1px",
  background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)"
}

const dividerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "600",
  letterSpacing: "1px",
  textTransform: "uppercase"
}

const infoBox: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "14px 16px",
  background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
  borderRadius: "12px",
  border: "1px solid #bae6fd"
}

const infoIcon: React.CSSProperties = {
  fontSize: "16px",
  flexShrink: 0,
  marginTop: "1px"
}

const infoText: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#0369a1",
  lineHeight: "1.5",
  fontWeight: "500"
}

const tagline: React.CSSProperties = {
  marginTop: "28px",
  fontSize: "13px",
  color: "rgba(203, 213, 225, 0.8)",
  fontWeight: "500",
  textAlign: "center",
  position: "relative",
  zIndex: 2
}

export default Login