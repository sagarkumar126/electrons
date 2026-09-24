import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { users, getUserByEmail, getUserById, saveRefreshToken, getUserByRefreshToken, clearRefreshToken } from "../db/user.collection"
import { ObjectId } from "mongodb"

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecretkey"

// ✅ Generate tokens
const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: "15m" } // 15 minutes
  )

  const refreshToken = jwt.sign(
    { id: userId },
    REFRESH_SECRET,
    { expiresIn: "7d" } // 7 days
  )

  return { accessToken, refreshToken }
}

// =====================================================
// GOOGLE LOGIN (BUYER APP) - FIXED
// =====================================================
router.post("/google", async (req, res) => {
  try {
    const { email, name, photo } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      })
    }

    let user = await getUserByEmail(email)

    // ✅ If not exists, create as buyer
    if (!user) {
      const result = await users().insertOne({
        email,
        name: name || email.split("@")[0],
        photo: photo || "",
        role: "buyer",
        kycStatus: null,
        isBlocked: false,
        authType: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshToken: null,
        refreshTokenExpiry: null
      })

      user = {
        _id: result.insertedId,
        email,
        name: name || email.split("@")[0],
        photo: photo || "",
        role: "buyer"
      } as any
    }

    // ✅ Blocked check
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      })
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role)

    await saveRefreshToken(user._id.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || null
      }
    })

  } catch (err) {
    console.error("Google login error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// REFRESH TOKEN ENDPOINT
// =====================================================
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required"
      })
    }

    let decoded: any
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET)
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      })
    }

    const user = await getUserByRefreshToken(refreshToken)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      })
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.role
    )

    await saveRefreshToken(user._id.toString(), newRefreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    })

  } catch (err) {
    console.error("Refresh token error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// LOGOUT
// =====================================================
router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body

    if (userId) {
      await clearRefreshToken(userId)
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// NORMAL REGISTER
// =====================================================
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    const existing = await getUserByEmail(email)

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await users().insertOne({
      email,
      name: name || email.split("@")[0],
      password: hashedPassword,
      role: role || "buyer",
      kycStatus: role === "seller" ? "Pending" : null,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshToken: null,
      refreshTokenExpiry: null
    })

    const { accessToken, refreshToken } = generateTokens(result.insertedId.toString(), role || "buyer")
    await saveRefreshToken(result.insertedId.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: result.insertedId,
        email,
        name: name || email.split("@")[0],
        role: role || "buyer"
      }
    })

  } catch (err) {
    console.error("Register error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// NORMAL LOGIN
// =====================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      })
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role)
    await saveRefreshToken(user._id.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// GOOGLE REGISTER FOR SELLER APP - FIXED
// =====================================================
router.post("/google-register", async (req, res) => {
  try {
    const { email, name, photo, role } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      })
    }

    const existing = await getUserByEmail(email)

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already registered"
      })
    }

    const userRole = role || "seller"

    const result = await users().insertOne({
      email,
      name: name || email.split("@")[0],
      photo: photo || "",
      role: userRole,
      kycStatus: "Pending",       // ✅ seller needs admin approval
      isBlocked: false,
      authType: "google",
      createdAt: new Date(),
      updatedAt: new Date(),
      refreshToken: null,
      refreshTokenExpiry: null
    })

    const { accessToken, refreshToken } = generateTokens(result.insertedId.toString(), userRole)
    await saveRefreshToken(result.insertedId.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: result.insertedId,
        email,
        name: name || email.split("@")[0],
        photo: photo || null,
        role: userRole
      }
    })

  } catch (err) {
    console.error("Google register error:", err)
    res.status(500).json({
      success: false,
      message: "Registration failed"
    })
  }
})

// =====================================================
// GOOGLE LOGIN FOR SELLER APP - FIXED
// =====================================================
router.post("/google-login", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      })
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Google account not registered"
      })
    }

    // ✅ Blocked check
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      })
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role)
    await saveRefreshToken(user._id.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || null
      }
    })

  } catch (err) {
    console.error("Google login error:", err)
    res.status(500).json({
      success: false,
      message: "Login failed"
    })
  }
})

// =====================================================
// SELLER PROFILE UPDATE
// =====================================================
router.put("/seller/profile/:id", async (req, res) => {
  try {
    const { name, email, description, address, phone, company } = req.body

    await users().updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          email,
          description,
          address,
          phone,
          company,
          updatedAt: new Date()
        }
      }
    )

    res.json({
      success: true,
      message: "Seller profile updated"
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Update failed"
    })
  }
})

// =====================================================
// GET SELLER PROFILE
// =====================================================
router.get("/seller/profile/:id", async (req, res) => {
  try {
    const seller = await users().findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      })
    }

    res.json({
      success: true,
      data: seller
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// GET BUYER PROFILE
// =====================================================
router.get("/buyer/profile/:id", async (req, res) => {
  try {
    const buyer = await users().findOne({
      _id: new ObjectId(req.params.id)
    })

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found"
      })
    }

    res.json({
      success: true,
      data: buyer
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// UPDATE BUYER PROFILE
// =====================================================
router.put("/buyer/profile/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      companyName,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      gstNumber,
      businessType
    } = req.body

    await users().updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          email,
          phone,
          companyName,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country,
          gstNumber,
          businessType,
          updatedAt: new Date()
        }
      }
    )

    const updated = await users().findOne({ _id: new ObjectId(req.params.id) })
    res.json({ success: true, user: updated })
  } catch (err) {
    res.status(500).json({ success: false, message: "Profile update failed" })
  }
})

// =====================================================
// ✅ ADMIN GOOGLE LOGIN
// =====================================================
router.post("/admin/google-login", async (req, res) => {
  try {
    const { email, name, photo } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      })
    }

    let user = await getUserByEmail(email)

    if (!user) {
      const result = await users().insertOne({
        email,
        name: name || email.split("@")[0],
        role: "admin",
        photo: photo || "",
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshToken: null,
        refreshTokenExpiry: null
      })
      user = await getUserByEmail(email)
    }

    if (user.role !== "admin") {
      await users().updateOne(
        { _id: user._id },
        { $set: { role: "admin", updatedAt: new Date() } }
      )
      user = await getUserByEmail(email)
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked."
      })
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role)
    await saveRefreshToken(user._id.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || null
      }
    })

  } catch (err) {
    console.error("Admin Google login error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// ✅ ADMIN REGISTER (First admin creation)
// =====================================================
router.post("/admin/register", async (req, res) => {
  try {
    const { email, name, photo, secretKey } = req.body

    const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123"
    if (secretKey !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid secret key"
      })
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      })
    }

    let user = await getUserByEmail(email)

    if (user) {
      if (user.role !== "admin") {
        await users().updateOne(
          { _id: user._id },
          { $set: { role: "admin", updatedAt: new Date() } }
        )
        user = await getUserByEmail(email)
      }
    } else {
      const result = await users().insertOne({
        email,
        name: name || email.split("@")[0],
        role: "admin",
        photo: photo || "",
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshToken: null,
        refreshTokenExpiry: null
      })
      user = await getUserByEmail(email)
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role)
    await saveRefreshToken(user._id.toString(), refreshToken)

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || null
      }
    })

  } catch (err) {
    console.error("Admin register error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// ✅ ADMIN LOGOUT
// =====================================================
router.post("/admin/logout", async (req, res) => {
  try {
    const { userId } = req.body

    if (userId) {
      await clearRefreshToken(userId)
    }

    res.json({
      success: true,
      message: "Logged out successfully"
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

// =====================================================
// ✅ GET CURRENT ADMIN
// =====================================================
router.get("/admin/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ success: false, message: "No token" })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    const user = await getUserById(decoded.id)

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not an admin" })
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || null
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" })
  }
})

export default router