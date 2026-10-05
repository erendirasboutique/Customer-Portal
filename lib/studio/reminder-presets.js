/* Starter items offered on Bills & supplies when the list is empty.
   Safe to import from both server and browser code. Add your own here. */

export const PRESETS = {
  "poly-mailers": { name: "Poly mailers", kind: "supply", category: "Shipping supplies", unit: "mailers", reorder_at: 50 },
  "packing-tape": { name: "Packing tape", kind: "supply", category: "Shipping supplies", unit: "rolls", reorder_at: 3 },
  "shipping-labels": { name: "Shipping labels", kind: "supply", category: "Shipping supplies", unit: "labels", reorder_at: 100 },
  "tissue-paper": { name: "Tissue paper", kind: "supply", category: "Packaging", unit: "packs", reorder_at: 2 },
  "thank-you-cards": { name: "Thank-you cards", kind: "supply", category: "Packaging", unit: "cards", reorder_at: 50 },
  "shopping-bags": { name: "Shopping bags", kind: "supply", category: "Packaging", unit: "bags", reorder_at: 25 },
  "hangers": { name: "Hangers", kind: "supply", category: "Store supplies", unit: "hangers", reorder_at: 25 },
  "price-tags": { name: "Price tags", kind: "supply", category: "Store supplies", unit: "tags", reorder_at: 100 },
  "receipt-paper": { name: "Receipt paper (Clover)", kind: "supply", category: "Store supplies", unit: "rolls", reorder_at: 3 },
  "rent": { name: "Rent", kind: "bill", category: "Rent", repeat: "monthly" },
  "utilities": { name: "Electric & utilities", kind: "bill", category: "Utilities", repeat: "monthly" },
  "internet": { name: "Internet & phone", kind: "bill", category: "Utilities", repeat: "monthly" },
  "insurance": { name: "Business insurance", kind: "bill", category: "Insurance", repeat: "yearly" },
  "sales-tax": { name: "Sales tax filing", kind: "bill", category: "Taxes", repeat: "quarterly" },
  "subscriptions": { name: "Software subscriptions", kind: "bill", category: "Subscriptions", repeat: "monthly" },
};

export const REPEAT_LABELS = {
  none: "Doesn't repeat",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
  custom: "Every ___ days",
};

export const CATEGORY_SUGGESTIONS = [
  "Shipping supplies", "Packaging", "Store supplies", "Inventory",
  "Rent", "Utilities", "Insurance", "Taxes", "Subscriptions", "Payroll", "Marketing", "Loans",
];
