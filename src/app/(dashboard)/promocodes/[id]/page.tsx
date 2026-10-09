"use client";

import { useParams } from "next/navigation";
import { PromoCodeEditor } from "@/components/promocodes/PromoCodeEditor";

export default function EditPromoCodePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  return (
  <>
    {Number.isFinite(id) ? (
      <PromoCodeEditor promoId={id} />
    ) : (
      <p className="text-sm text-red-600">Invalid promo code id.</p>
    )}
  </>
  );
}
