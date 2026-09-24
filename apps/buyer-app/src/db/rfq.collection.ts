import { getDB } from "./mongo"
import { ObjectId } from "mongodb"

export const rfqs = () => {
  return getDB().collection("rfqs")
}

// ✅ Create RFQ
export const createRFQ = async (data: any) => {
  const result = await rfqs().insertOne({
    ...data,
    status: "Pending",
    createdAt: new Date(),
    updatedAt: new Date()
  })
  return result
}

// ✅ Get RFQ by ID
export const getRFQById = async (id: string) => {
  return await rfqs().findOne({ _id: new ObjectId(id) })
}

// ✅ Get RFQs by Buyer
export const getRFQsByBuyer = async (buyerId: string) => {
  return await rfqs()
    .find({ buyerId })
    .sort({ createdAt: -1 })
    .toArray()
}

// ✅ Get RFQs by Seller
export const getRFQsBySeller = async (sellerId: string) => {
  return await rfqs()
    .find({ sellerId })
    .sort({ createdAt: -1 })
    .toArray()
}

// ✅ Update RFQ status
export const updateRFQStatus = async (id: string, status: string) => {
  return await rfqs().updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        status, 
        updatedAt: new Date() 
      } 
    }
  )
}

// ✅ Add quote to RFQ
export const addQuoteToRFQ = async (id: string, quoteData: any) => {
  return await rfqs().updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        quote: quoteData,
        status: "Quoted",
        updatedAt: new Date() 
      } 
    }
  )
}