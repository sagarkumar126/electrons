interface LoadingSpinnerProps {
  size?: number
  message?: string
}

const LoadingSpinner = ({ size = 40, message = "Loading..." }: LoadingSpinnerProps) => {
  return (
    <div style={container}>
      <div style={{ ...spinner, width: size, height: size }} />
      <p style={text}>{message}</p>
    </div>
  )
}

const container = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "40px"
}

const spinner = {
  border: "4px solid #e2e8f0",
  borderTop: "4px solid #2563eb",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
}

const text = {
  marginTop: "16px",
  color: "#64748b",
  fontSize: "14px"
}

export default LoadingSpinner