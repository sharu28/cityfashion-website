"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics";
import type { MerchandisingLane } from "@/lib/catalog";

type ProductViewTrackerProps = {
  category: string;
  merchandisingLane: MerchandisingLane;
  productId: string;
  productName: string;
};

export function ProductViewTracker({ category, merchandisingLane, productId, productName }: ProductViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent("view_item", {
      item_category: category,
      item_id: productId,
      item_name: productName,
      merchandising_lane: merchandisingLane,
      items: [
        {
          item_category: category,
          item_id: productId,
          item_name: productName,
        },
      ],
    });
  }, [category, merchandisingLane, productId, productName]);

  return null;
}
