import { ReactNode } from "react"
import Sidebar from "../components/Layout/Sidebar"

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div style={container}>
      <Sidebar />
      <div style={mainContent}>
        <div style={contentWrapper}>{children}</div>
      </div>
    </div>
  )
}

const container = {
  display: "flex",
  minHeight: "100vh",
  background: "#f1f5f9"
}

const mainContent = {
  flex: 1,
  marginLeft: "250px",
  padding: "20px"
}

const contentWrapper = {
  maxWidth: "1400px",
  margin: "0 auto"
}

export default AdminLayout