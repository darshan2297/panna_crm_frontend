import { redirect } from "next/navigation";

export default function PackagingConsumptionRedirect() {
  redirect("/packaging?tab=consumption");
}
