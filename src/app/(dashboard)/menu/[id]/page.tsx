"use client";

import { useParams } from "next/navigation";
import { MenuItemEditor } from "@/components/menu/MenuItemEditor";

export default function EditMenuItemPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-red-600">Invalid menu dish id.</p>;
  }

  return <MenuItemEditor menuItemId={id} />;
}