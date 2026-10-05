/* Document vault settings. Safe to import from server and browser. */

export const DOC_CATEGORIES = [
  "Permits & licenses",
  "Taxes",
  "Insurance",
  "Lease & property",
  "Bank & payments",
  "Vendors & suppliers",
  "Employees",
  "Contracts",
  "Receipts",
  "Other",
];

export const MAX_DOC_MB = 25;

export const DOC_TYPES = {
  "application/pdf": "PDF",
  "image/jpeg": "Photo",
  "image/png": "Image",
  "image/webp": "Image",
  "image/heic": "Photo",
  "image/heif": "Photo",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "text/csv": "CSV",
  "text/plain": "Text",
};

export function safeFileName(name) {
  const base = String(name || "file").normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim().replace(/\s+/g, "-");
  return (base || "file").slice(-100);
}
