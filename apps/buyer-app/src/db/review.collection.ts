import { getDB } from "./mongo"

export const reviews = () => {
  return getDB().collection("reviews")
}

export const getSellerReviews = async (sellerId: string) => {
  return await reviews()
    .find({ sellerId })
    .sort({ createdAt: -1 })
    .toArray()
}

export const getSellerAverageRating = async (sellerId: string) => {
  const result = await reviews().aggregate([
    { $match: { sellerId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, total: { $sum: 1 } } }
  ]).toArray()
  
  return result.length > 0 ? result[0] : { avgRating: 0, total: 0 }
}