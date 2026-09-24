import { getDB } from "./mongo"
import { ObjectId } from "mongodb"

export const users = () => {
  return getDB().collection("users")
}

// ✅ Naya: Get user by ID
export const getUserById = async (id: string) => {
  return await users().findOne({ _id: new ObjectId(id) })
}

// ✅ Naya: Get user by email
export const getUserByEmail = async (email: string) => {
  return await users().findOne({ email })
}

// ✅ Naya: Save refresh token
export const saveRefreshToken = async (userId: string, refreshToken: string) => {
  return await users().updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      } 
    }
  )
}

// ✅ Naya: Get user by refresh token
export const getUserByRefreshToken = async (refreshToken: string) => {
  return await users().findOne({ 
    refreshToken: refreshToken,
    refreshTokenExpiry: { $gt: new Date() }
  })
}

// ✅ Naya: Clear refresh token (logout)
export const clearRefreshToken = async (userId: string) => {
  return await users().updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        refreshToken: null,
        refreshTokenExpiry: null
      } 
    }
  )
}