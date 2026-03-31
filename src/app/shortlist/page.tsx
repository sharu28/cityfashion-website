import { CatalogShell } from "@/components/catalog-shell";
import { ShortlistPage } from "@/components/shortlist-page";

export default function RetailerShortlistPage() {
  return (
    <main className="pb-16 pt-24">
      <CatalogShell>
        <ShortlistPage />
      </CatalogShell>
    </main>
  );
}
