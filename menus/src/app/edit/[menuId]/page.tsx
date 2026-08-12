import { notFound } from "next/navigation";
import { MENU_IDS, getMenuMeta } from "@/menus/registry";
import { SEED_MENUS } from "@/lib/seed";
import { Editor } from "@/components/Editor";

/**
 * A static shell. Under `output: "export"` every route is generated at build
 * time, so this page can't read anything at request time — the content load
 * moves into the client component.
 *
 * `generateStaticParams` is mandatory for a dynamic segment under export, even
 * with a single id.
 */
export function generateStaticParams() {
  return MENU_IDS.map((menuId) => ({ menuId }));
}

export default function EditPage({ params }: { params: { menuId: string } }) {
  const meta = getMenuMeta(params.menuId);
  if (!meta) notFound();

  // TEMPORARY: seed content passed inline so the build compiles and the PDF
  // export path can be exercised against a real static build. The client-side
  // sheet load replaces this.
  return (
    <Editor menuId={meta.id} menuLabel={meta.label} initialContent={SEED_MENUS[meta.id]} />
  );
}
