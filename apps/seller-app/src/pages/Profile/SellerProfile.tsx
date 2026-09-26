import { useState, useEffect } from "react"
import axios from "axios"

const Field = ({ label, children }: any) => {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  )
}




const SellerProfile = () => {

  const [edit, setEdit] = useState(false)

  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [gstNumber, setGstNumber] = useState("")

  const [address, setAddress] = useState("")
  const [storeDescription, setStoreDescription] = useState("")
  const [yearsInBusiness, setYearsInBusiness] = useState("")

  const [kycStatus, setKycStatus] = useState("Pending")
  const [panNumber, setPanNumber] = useState("")
  const [businessRegNumber, setBusinessRegNumber] = useState("")

  const [isDistributor, setIsDistributor] = useState(false)

  const [user, setUser] = useState<any>(
    JSON.parse(localStorage.getItem("user") || "{}")
  )

  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || "")
      setPhone(user.phone || "")
      setEmail(user.email || "")
      setGstNumber(user.gstNumber || "")
      setAddress(user.address || "")
      setStoreDescription(user.storeDescription || "")
      setYearsInBusiness(user.yearsInBusiness || "")

      setKycStatus(user.kycStatus || "Pending")
      setPanNumber(user.panNumber || "")
      setBusinessRegNumber(user.businessRegNumber || "")

      setIsDistributor(user.isDistributor || false)
    }
  }, [])

  const saveProfile = async () => {
    try {
      const updatedUser = {
        ...user,
        companyName,
        phone,
        email,
        gstNumber,
        address,
        storeDescription,
        yearsInBusiness,
        kycStatus,
        panNumber,
        businessRegNumber,
        isDistributor
      }

      const res = await axios.put(
        "https://electrons-1.onrender.com/api/seller/update-profile",
        updatedUser
      )

      const finalUser = res.data?.user || updatedUser

      localStorage.setItem("user", JSON.stringify(finalUser))
      setUser(finalUser)

      setEdit(false)
      alert("Profile updated successfully")

    } catch (err) {
      alert("Failed to update profile")
    }
  }

  return (
    <div style={styles.container}>

      <div style={styles.card}>
        <h1 style={styles.title}>Seller Profile</h1>

        <div style={styles.buttonRow}>
          {edit ? (
            <>
              <button onClick={saveProfile} style={styles.saveBtn}>Save</button>
              <button onClick={() => setEdit(false)} style={styles.cancelBtn}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEdit(true)} style={styles.editBtn}>Edit Profile</button>
          )}
        </div>

        <div style={styles.section}>
          <h3>Company Information</h3>

          <Field label="Company Name">
            <input value={companyName} disabled={!edit}
              onChange={(e) => setCompanyName(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Phone">
            <input value={phone} disabled={!edit}
              onChange={(e) => setPhone(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Email">
            <input value={email} disabled={!edit}
              onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          </Field>

          <Field label="GST Number">
            <input value={gstNumber} disabled={!edit}
              onChange={(e) => setGstNumber(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Years in Business">
            <input value={yearsInBusiness} disabled={!edit}
              onChange={(e) => setYearsInBusiness(e.target.value)} style={styles.input} />
          </Field>

          <Field label="KYC Status">
            <input value={kycStatus} disabled style={styles.input} />
          </Field>

          <Field label="PAN Number">
            <input value={panNumber} disabled={!edit}
              onChange={(e) => setPanNumber(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Business Registration Number">
            <input value={businessRegNumber} disabled={!edit}
              onChange={(e) => setBusinessRegNumber(e.target.value)} style={styles.input} />
          </Field>

          <Field label="Distributor">
            <select value={isDistributor ? "yes" : "no"} disabled={!edit}
              onChange={(e) => setIsDistributor(e.target.value === "yes")} style={styles.input}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
        </div>

        <div style={styles.section}>
          <h3>Store Description</h3>

          <Field label="Description">
            <textarea value={storeDescription} disabled={!edit}
              onChange={(e) => setStoreDescription(e.target.value)} style={styles.textarea} />
          </Field>
        </div>

        <div style={styles.section}>
          <h3>Company Address</h3>

          <Field label="Address">
            <textarea value={address} disabled={!edit}
              onChange={(e) => setAddress(e.target.value)} style={styles.textarea} />
          </Field>
        </div>

      </div>
    </div>
  )
}

const styles: any = {

  container: {
    padding: "30px",
    background: "#f3f4f6",
    minHeight: "100vh"
  },

  card: {
    maxWidth: "900px",
    margin: "auto",
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },

  title: {
    marginBottom: "15px",
    color: "#111827"
  },

  buttonRow: {
    marginBottom: "20px",
    display: "flex",
    gap: "10px"
  },

  section: {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fafafa"
  },

  field: {
    marginTop: "12px"
  },

  label: {
    fontWeight: "600",
    display: "block",
    marginBottom: "6px",
    color: "#111827"
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    outline: "none"
  },

  textarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    minHeight: "100px"
  },

  editBtn: {
    padding: "10px 15px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  saveBtn: {
    padding: "10px 15px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  cancelBtn: {
    padding: "10px 15px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
}

export default SellerProfile