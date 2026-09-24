export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Pending: "#f59e0b",
    Confirmed: "#3b82f6",
    Processing: "#8b5cf6",
    Shipped: "#06b6d4",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
    Verified: "#22c55e",
    Rejected: "#ef4444",
    Paid: "#22c55e"
  }
  return colors[status] || "#6b7280"
}