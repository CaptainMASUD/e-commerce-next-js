import ProductsCategoryPage from "@/Components/Home/ProductsPage";

function titleCaseFromSlug(s) {
  return String(s || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function generateMetadata({ params }) {
  const { categorySlug = "", subSlug = "" } = await params;

  const categoryName = titleCaseFromSlug(categorySlug);
  const subName = titleCaseFromSlug(subSlug);

  return {
    title: `${subName} in ${categoryName}`,
    description: `Shop ${subName} products in ${categoryName} at Aura & OHM.`,
    alternates: {
      canonical: `/c/${categorySlug}/${subSlug}`,
    },
    openGraph: {
      title: `${subName} in ${categoryName}`,
      description: `Shop ${subName} products in ${categoryName} at Aura & OHM.`,
      url: `/c/${categorySlug}/${subSlug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${subName} in ${categoryName}`,
      description: `Shop ${subName} products in ${categoryName} at Aura & OHM.`,
    },
  };
}

export default function CategoryListingPage() {
  return <ProductsCategoryPage />;
}