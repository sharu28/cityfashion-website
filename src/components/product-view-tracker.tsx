"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics";

type ProductViewTrackerProps = {
  category: string;
  productId: string;
  productName: string;
};

export function ProductViewTracker({ category, productId, productName }: ProductViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent("view_item", {
      item_category: category,
      item_id: productId,
      item_name: productName,
      items: [
        {
          item_category: category,
          item_id: productId,
          item_name: productName,
        },
      ],
    });
  }, [category, productId, productName]);

  return null;
}
