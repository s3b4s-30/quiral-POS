import React from "react";
import ProductCard, { ProductCardProps } from "../../inventory/components/ProductCard";

export interface PosProductCardProps {
  product: ProductCardProps["product"];
  inCart: number;
  onAddToCart: (productId: string) => void;
  supplierColors: Map<string, string>;
}

export const PosProductCard = React.memo(function PosProductCard({
  product,
  inCart,
  onAddToCart,
  supplierColors,
}: PosProductCardProps) {
  return (
    <ProductCard
      product={product}
      mode="pos"
      inCart={inCart}
      onAddToCart={onAddToCart}
      supplierColors={supplierColors}
    />
  );
});

export default PosProductCard;
