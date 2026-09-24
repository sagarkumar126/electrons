// =====================================================
// middleware/auth.middleware.ts
// =====================================================

import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { getUserById } from "../db/user.collection"

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

// ✅ FIX: Use any for Request — avoids Express 5 type issues
export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

// ✅ Helper to safely get headers
const getAuthHeader = (req: any): string | undefined => {
  return req.headers?.authorization
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = getAuthHeader(req)

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

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = getAuthHeader(req)

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

    const user = await getUserById(decoded.id)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      })
    }

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