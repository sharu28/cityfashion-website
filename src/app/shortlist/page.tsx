import { CatalogShell } from "@/components/catalog-shell";
import { ShortlistPage } from "@/components/shortlist-page";

export default function RetailerShortlistPage() {
  return (
    <main className="overflow-hidden pb-16 pt-28">
      <CatalogShell>
        <ShortlistPage />
      </CatalogShell>
    </main>
  );
}
