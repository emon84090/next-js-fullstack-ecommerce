// app/(main)/products/page.js

import AllProducts from "@/components/website/All Products/AllProducts";
import React from "react";

// Add this metadata object
export const metadata = {
  title: "Shop All Products",
  description:
    "Explore our full range of products, including electronics, apparel, home goods, and more. Find the perfect item for your needs at our online store.",
  keywords: [
    "all products",
    "shop online",
    "e-commerce store",
    "best deals",
    "new arrivals",
  ],
};

const page = () => {
  return (
    <>
      <AllProducts />
    </>
  );
};

export default page;
