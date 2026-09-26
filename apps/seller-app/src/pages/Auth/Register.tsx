import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../../firebase"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const Register = () => {

  const navigate = useNavigate()

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGoogleRegister = async () => {

    setError("")
    setSuccess("")

    try {

      setLoading(true)

      const provider =
        new GoogleAuthProvider()

      const result =
        await signInWithPopup(
          auth,
          provider
        )

      const email =
        result.user.email

      const name =
        result.user.displayName

      const photo =
        result.user.photoURL

      const res = await axios.post(
        "https://electrons-1.onrender.com/api/auth/google-register",
        {
          email,
          name,
          photo
        }
      )

      localStorage.setItem(
        "token",
        res.data.token
      )

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      )

      setSuccess(
        "Registered Successfully"
      )

      setTimeout(() => {
        navigate("/home")
      }, 1500)

    } catch (err: any) {

      if (
        err?.response?.data?.message
      ) {

        setError(
          err.response.data.message
        )

      } else {

        setError(
          "Registration failed"
        )

      }

    } finally {

      setLoading(false)

    }
  }

  return (
    <div style={styles.container}>

      <div style={styles.box}>

        <h1 style={styles.title}>
          Seller Register
        </h1>

        <button
          onClick={
            handleGoogleRegister
          }
          style={styles.googleBtn}
        >
          {
            loading
              ? "Please wait..."
              : "Register with Google"
          }
        </button>

        {
          success && (
            <p style={styles.success}>
              {success}
            </p>
          )
        }

        {
          error && (
            <p style={styles.error}>
              {error}
            </p>
          )
        }

        <p style={{ marginTop: 20 }}>

          Already registered?{" "}

          <span
            onClick={() =>
              navigate("/login")
            }
            style={styles.link}
          >
            Login Here
          </span>

        </p>

      </div>

    </div>
  )
}

const styles: any = {

  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f4f6"
  },

  box: {
    width: 400,
    background: "white",
    padding: 30,
    borderRadius: 12,
    boxShadow:
      "0 0 10px rgba(0,0,0,0.1)",
    textAlign: "center"
  },

  title: {
    marginBottom: 25
  },

  googleBtn: {
    width: "100%",
    padding: 14,
    border: "none",
    borderRadius: 8,
    background: "#34A853",
    color: "white",
    fontSize: 16,
    cursor: "pointer"
  },

  error: {
    color: "red",
    marginTop: 15
  },

  success: {
    color: "green",
    marginTop: 15,
    fontWeight: "bold"
  },

  link: {
    color: "blue",
    cursor: "pointer",
    fontWeight: "bold"
  }
}

export default Register