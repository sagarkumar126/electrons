// =====================================================
// middleware/auth.middleware.ts (Updated with adminMiddleware)
// =====================================================

import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { getUserById } from "../db/user.collection"

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

// ✅ FIX: Request type with generics for headers support
export interface AuthRequest extends Request<any, any, any, any> {
  user?: {
    id: string
    role: string
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string }

    // ✅ Verify user still exists in database
    const user = await getUserById(decoded.id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      })
    }

    req.user = {
      id: decoded.id,
      role: decoded.role
    }

    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}

// ✅ Naya: Role-based middleware (Admin/Seller/Buyer)
export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions"
      })
    }

    next()
  }
}

// ✅ ADMIN MIDDLEWARE - YEH ADD KARO
export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string }

    // ✅ Verify user still exists in database
    const user = await getUserById(decoded.id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      })
    }

    // ✅ Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      })
    }

    req.user = {
      id: decoded.id,
      role: decoded.role
    }

    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}