import { notFound } from "next/navigation";
import { readMenu } from "@/lib/store";
import { getMenuMeta } from "@/menus/registry";
import { Editor } from "@/components/Editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { menuId: string } }) {
  const meta = getMenuMeta(params.menuId);
  if (!meta) notFound();

  const content = await readMenu(params.menuId);
  if (!content) notFound();

  return <Editor menuId={meta.id} menuLabel={meta.label} initialContent={content} />;
}
