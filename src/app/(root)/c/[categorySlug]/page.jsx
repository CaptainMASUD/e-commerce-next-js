import ProductsCategoryPage from "@/Components/Home/ProductsPage";

function titleCaseFromSlug(s) {
  return String(s || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function generateMetadata({ params }) {
  const categorySlug = params?.categorySlug || "";
  const categoryName = titleCaseFromSlug(categorySlug);

  return {
    title: `${categoryName} Products`,
    description: `Browse ${categoryName} products at Aura & OHM.`,
    alternates: {
      canonical: `/c/${categorySlug}`,
    },
    openGraph: {
      title: `${categoryName} Products`,
      description: `Browse ${categoryName} products at Aura & OHM.`,
      url: `/c/${categorySlug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} Products`,
      description: `Browse ${categoryName} products at Aura & OHM.`,
    },
  };
}

export default function CategoryListingPage() {
  return <ProductsCategoryPage />;
}