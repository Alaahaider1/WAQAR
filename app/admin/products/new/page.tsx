import { createServerClient } from "@/src/lib/supabase/server";
import { CategoryRepository } from "@/src/repositories/category.repository";
import { AdminAddProductClient } from "@/components/admin/AdminAddProductClient";

export default async function AdminAddProductPage() {
  const supabase = await createServerClient();
  const categories = await new CategoryRepository(supabase).findAll(true);

  return <AdminAddProductClient categories={categories} />;
}
