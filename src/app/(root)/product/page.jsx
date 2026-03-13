import ShopPageClient from "./ShopPageClient";

export default async function Page({ searchParams }) {
  const sp = await searchParams;

  return (
    <ShopPageClient
      initialQ={sp?.q || ""}
      initialCategorySlug={sp?.categorySlug || ""}
      initialSubSlug={sp?.subSlug || ""}
      initialBrand={sp?.brand || ""}
    />
  );
}