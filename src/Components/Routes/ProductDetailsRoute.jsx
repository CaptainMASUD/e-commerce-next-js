import React, { useMemo } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import ProductDetailsPage from "../ProductDetailsPage/ProductDetailsPage";
import { getAllProducts } from "../Home/HomePage";

export default function ProductDetailsRoute() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const loaderProduct = useLoaderData();

  const product = useMemo(() => {
    return loaderProduct || getAllProducts().find((p) => p.id === productId) || null;
  }, [loaderProduct, productId]);

  if (!product) return <div className="p-6 font-bold">Product not found</div>;

  return <ProductDetailsPage product={product} onBack={() => navigate(-1)} />;
}
