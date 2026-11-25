"use client";

import { createContext, useContext, useState } from "react";

type ProductPageState = {
  /** Photo the gallery should show. Bumps `photoRequest` so the same photo can be asked for twice. */
  photoRequest: { image: string; at: number } | null;
  showPhoto(image: string): void;
};

const ProductPageContext = createContext<ProductPageState | null>(null);

/** Lets the colour picker move the photo gallery on the same product page. */
export function ProductPageStateProvider({ children }: { children: React.ReactNode }) {
  const [photoRequest, setPhotoRequest] = useState<ProductPageState["photoRequest"]>(null);
  return (
    <ProductPageContext.Provider
      value={{ photoRequest, showPhoto: (image) => setPhotoRequest({ image, at: Date.now() }) }}
    >
      {children}
    </ProductPageContext.Provider>
  );
}

export function useProductPageState() {
  return useContext(ProductPageContext);
}
