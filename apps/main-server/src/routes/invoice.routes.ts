import express from "express"
import PDFDocument from "pdfkit"
import { getDB } from "../db/mongo"
import { ObjectId } from "mongodb"

const router = express.Router()

router.get("/:orderId", async (req, res) => {
  try {
    const order = await getDB().collection("orders").findOne({ orderId: req.params.orderId })
    if (!order) return res.status(404).json({ message: "Order not found" })

    const buyer = await getDB().collection("users").findOne({ _id: new ObjectId(order.buyerId) })
    const seller = await getDB().collection("users").findOne({ _id: new ObjectId(order.sellerId) })

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${order.orderId}.pdf`)
    doc.pipe(res)

    // Header
    doc.fontSize(20).text("TAX INVOICE", { align: "center" })
    doc.moveDown()
    doc.fontSize(10).text(`Invoice No: ${order.orderId}`, 50, doc.y)
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, doc.y + 15)
    doc.moveDown(2)

    // Seller
    doc.fontSize(12).text("Seller Information:", { underline: true })
    doc.fontSize(10).text(seller?.companyName || seller?.name)
    doc.text(`GST: ${seller?.gstNumber || "Not registered"}`)
    doc.moveDown()

    // Buyer
    doc.fontSize(12).text("Buyer Information:", { underline: true })
    doc.fontSize(10).text(buyer?.name)
    doc.text(buyer?.email)
    doc.moveDown()

    // Product
    doc.fontSize(12).text("Product Details:", { underline: true })
    doc.fontSize(10)
    doc.text(`Product: ${order.productName}`)
    doc.text(`Quantity: ${order.quantity}`)
    doc.text(`Price: ₹${order.price} per unit`)
    doc.text(`Total: ₹${order.totalAmount}`)
    doc.text(`GST (18%): ₹${(order.totalAmount * 0.18).toFixed(2)}`)
    doc.text(`Grand Total: ₹${(order.totalAmount * 1.18).toFixed(2)}`)
    doc.moveDown()
    doc.text(`Payment Terms: ${order.paymentTerms}`)
    doc.moveDown()
    doc.fontSize(8).text("Thank you for your business!", { align: "center" })

    doc.end()
  } catch (err) {
    res.status(500).json({ message: "Failed to generate invoice" })
  }
})

export default router