import { notFound } from "next/navigation";
import { MENU_IDS, getMenuMeta } from "@/menus/registry";
import { Editor } from "@/components/Editor";

/**
 * A static shell. Under `output: "export"` every route is generated at build
 * time, so this page reads nothing — the spreadsheet load happens in the
 * client component.
 *
 * `generateStaticParams` is mandatory for a dynamic segment under export, even
 * with a single id. An id outside this list produces no page at all, so an
 * unknown menu is the host's 404 rather than an in-app state.
 */
export function generateStaticParams() {
  return MENU_IDS.map((menuId) => ({ menuId }));
}

export default function MenuPage({ params }: { params: { menuId: string } }) {
  const meta = getMenuMeta(params.menuId);
  if (!meta) notFound();

  return <Editor menuId={meta.id} menuLabel={meta.label} />;
}
