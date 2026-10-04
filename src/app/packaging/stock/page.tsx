import { redirect } from "next/navigation";

export default function PackagingStockRedirect() {
  redirect("/packaging?tab=stock");
}
