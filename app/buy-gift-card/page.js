import BuyGiftCard from "@/components/shop/BuyGiftCard";
import { SHOP } from "@/lib/shop/gift-card-shop";
import { emailEnabled } from "@/lib/shop/service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buy a Gift Card · Erendira's Boutique",
  description: "Send an Erendira's Boutique gift card by email or print it at home.",
};

/* Public page: /buy-gift-card */
export default function BuyGiftCardPage() {
  return (
    <BuyGiftCard
      presets={SHOP.presets}
      min={SHOP.min}
      max={SHOP.max}
      canEmail={emailEnabled()}
    />
  );
}
