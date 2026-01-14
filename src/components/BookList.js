import React from "react";

const pill = {
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "2px 8px",
  background: "#fff"
};

function firstStoreUrl(book) {
  // Prefer a top-level store_url if you add one in your API
  if (book.store_url) return book.store_url;
  // Otherwise try to find one in availability array
  const hit = (book.availability || []).find(a => a.store_url);
  return hit ? hit.store_url : null;
}

function BookCard({ book }) {
  const anyInStock = (book.availability || []).some(a => a.in_stock || a.availability_status === "In Stock");
  const storeUrl = firstStoreUrl(book);

  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 16,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{book.title}</div>
          {book.author && <div style={{ color: "#6b7280", fontSize: 14 }}>{book.author}</div>}
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, color: "#374151" }}>
            {book.subject && <span style={pill}>{book.subject}</span>}
            {book.isbn && <span style={pill}>ISBN: {book.isbn}</span>}
          </div>
        </div>
        <span style={{
          alignSelf: "start",
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 999,
          background: anyInStock ? "#ecfdf5" : "#f3f4f6",
          color: anyInStock ? "#065f46" : "#374151",
          border: "1px solid " + (anyInStock ? "rgba(16,185,129,0.3)" : "rgba(107,114,128,0.2)")
        }}>
          {anyInStock ? "In stock locally" : "Check availability"}
        </span>
      </div>

      {/* Availability block (no more \"Buy at ___\") */}
      {(book.availability || []).length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {book.availability.map((a, i) => (
            <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius: 12, padding: 10, background:"#fafafa" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{a.store || "Local bookstore"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {a.in_stock || a.availability_status === "In Stock" ? "Available" : "Out of stock / Ask store"}
                  </div>
                </div>

                {/* Single, clean link to the store homepage if known */}
                {(a.store_url || storeUrl) ? (
                  <a
                    href={a.store_url || storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1f2937",
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "8px 10px",
                      background: "#ffffff"
                    }}
                  >
                    Visit Store Website
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    No website on file
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookList({ items, emptyLabel }) {
  if (!items || items.length === 0) {
    return (
      <div style={{
        border: "1px dashed #d1d5db",
        borderRadius: 16,
        padding: 24,
        textAlign: "center",
        color: "#6b7280",
        background: "#f8fafc"
      }}>
        {emptyLabel || "No books found."}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))" }}>
      {items.map((b, i) => <BookCard key={b.id || b.isbn || `${b.title}-${i}`} book={b} />)}
    </div>
  );
}
