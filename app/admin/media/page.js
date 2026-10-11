export default function MediaPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        height: "calc(100vh - 2rem)",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.1, color: "#8B7D6B" }}>
          Media
        </h1>
        <a
          href="https://media.erendirasboutique.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "6px 12px",
            border: "1px solid #D9CFC1",
            borderRadius: 8,
            background: "#F5F3EF",
            color: "#8B7D6B",
            fontSize: 14,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src="https://media.erendirasboutique.com/"
        title="Media uploads"
        allow="clipboard-write"
        style={{
          flex: 1,
          width: "100%",
          minHeight: 600,
          border: "1px solid #D9CFC1",
          borderRadius: 12,
          background: "#F5F3EF",
          display: "block",
        }}
      />
    </div>
  );
}
