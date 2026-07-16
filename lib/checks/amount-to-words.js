const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function underOneThousand(number) {
  let value = number;
  const words = [];

  if (value >= 100) {
    words.push(`${ONES[Math.floor(value / 100)]} hundred`);
    value %= 100;
  }

  if (value >= 20) {
    const tens = TENS[Math.floor(value / 10)];
    const ones = value % 10;
    words.push(ones ? `${tens}-${ONES[ones]}` : tens);
  } else if (value > 0) {
    words.push(ONES[value]);
  }

  return words.join(" ");
}

function integerToWords(number) {
  if (number === 0) return "zero";

  const groups = [
    { value: 1_000_000_000, label: "billion" },
    { value: 1_000_000, label: "million" },
    { value: 1_000, label: "thousand" },
  ];

  let remaining = number;
  const words = [];

  for (const group of groups) {
    if (remaining >= group.value) {
      const quantity = Math.floor(remaining / group.value);
      words.push(`${underOneThousand(quantity)} ${group.label}`);
      remaining %= group.value;
    }
  }

  if (remaining > 0) {
    words.push(underOneThousand(remaining));
  }

  return words.join(" ");
}

export function dollarsToCheckWords(amountCents) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive number of cents.");
  }

  const dollars = Math.floor(amountCents / 100);
  const cents = amountCents % 100;

  if (dollars > 999_999_999_999) {
    throw new Error("Amount is too large.");
  }

  const dollarWords = integerToWords(dollars);
  const dollarLabel = dollars === 1 ? "dollar" : "dollars";

  return `${dollarWords} ${dollarLabel} and ${String(cents).padStart(2, "0")}/100`;
}

export function formatMoney(amountCents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}
