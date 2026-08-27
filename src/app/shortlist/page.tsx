import { CatalogShell } from "@/components/catalog-shell";
import { ShortlistPage } from "@/components/shortlist-page";

export default function RetailerShortlistPage() {
  return (
    <main className="overflow-hidden pb-16 pt-20">
      <CatalogShell className="max-w-[1500px] px-3 pt-6 sm:px-5 lg:px-7">
        <ShortlistPage />
      </CatalogShell>
    </main>
  );
}
