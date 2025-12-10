// src/pages/NewsletterPage.js
import React from "react";

export default function NewsletterPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <header style={{
        background: "linear-gradient(135deg, #ecfeff, #f0f9ff)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 24,
        padding: 20,
        marginBottom: 20
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Newsletter & Updates</h1>
        <p style={{ marginTop: 8, color: "#374151" }}>
          Release notes, partner announcements, and tips for using the site.
        </p>
      </header>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))" }}>
        <article style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700 }}>Welcome to NYU Madrid Book Finder</h3>
          <p style={{ margin: 0, color: "#374151" }}>
            This site helps you find <b>required</b> and <b>recommended</b> books for your courses at local bookstores.
          </p>
        </article>

        <article style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}>
          <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700 }}>How updates will work</h3>
          <p style={{ margin: 0, color: "#374151" }}>
            We’ll post improvements and new bookstore partners here. Soon this will be fetched from the backend.
          </p>
        </article>
      </div>
    </div>
  );
}
