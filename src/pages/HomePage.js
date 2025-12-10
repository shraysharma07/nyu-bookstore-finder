// src/pages/HomePage.js
import React from "react";

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <header style={{
        background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 24,
        padding: 20,
        marginBottom: 20
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>NYU Madrid Book Finder</h1>
        <p style={{ marginTop: 8, color: "#374151", lineHeight: 1.6 }}>
          Welcome! This site helps you find <b>required</b> and <b>recommended</b> books for your
          NYU Madrid courses at local bookstores. Use the <b>Find My Books</b> tab to enter your
          details and see results split into tabs.
        </p>

        <div style={{ display:"grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", marginTop: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>How to use</h3>
            <ul style={{ margin: "8px 0 0 18px", color: "#374151" }}>
              <li>Go to <b>Find My Books</b> and enter your info.</li>
              <li>On the results page, switch between <b>Required</b> and <b>Recommended</b> tabs.</li>
              <li>Click a store to check stock, price, and directions.</li>
            </ul>
          </div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Limitations</h3>
            <ul style={{ margin: "8px 0 0 18px", color: "#374151" }}>
              <li>Inventory feeds may lag behind in-store stock.</li>
              <li>Some courses allow alternate editions—check your syllabus.</li>
              <li>Prices shown are estimates; confirm student discounts in store.</li>
            </ul>
          </div>
        </div>
      </header>

      <section>
        <p style={{ color: "#4b5563" }}>
          Questions or partnership inquiries? Reach out to the project team. This is a student-built site and not an official NYU service.
        </p>
      </section>
    </div>
  );
}
