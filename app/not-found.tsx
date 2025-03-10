import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#333",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <h1
        style={{
          fontSize: "8rem",
          margin: "0",
          fontWeight: "700",
          color: "#e63946",
          lineHeight: "1",
        }}
      >
        404
      </h1>

      <h2
        style={{
          fontSize: "2rem",
          margin: "0 0 1.5rem",
          fontWeight: "500",
          color: "#1d3557",
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          fontSize: "1.1rem",
          maxWidth: "500px",
          marginBottom: "2rem",
          color: "#457b9d",
        }}
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#1d3557",
          color: "white",
          textDecoration: "none",
          borderRadius: "4px",
          fontWeight: "500",
          transition: "background-color 0.2s ease",
          border: "none",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={18} />
        Back to Home
      </Link>
    </div>
  )
}
