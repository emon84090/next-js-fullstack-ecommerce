"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Star,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  ChevronRight,
  Share2,
  Loader2,
  CheckCircle,
  PackageX,
  ZoomIn,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageModal from "@/components/others/Imagemodal";
import { useCartWithSession } from "@/lib/cartStore";
import useWishlistStore from "@/lib/wishlistStore";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ReviewForm from "@/components/others/ReviewFrom";

/* ─────────────────────────────────────────────────────────
   Star renderer helper
───────────────────────────────────────────────────────── */
function StarRow({ rating, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${size} ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SingleProductDetail({ productData }) {
  const { cartItems, addToCart, updateCartItemQuantity } = useCartWithSession();
  const { wishlist, toggleWishlist, fetchWishlist } = useWishlistStore();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const hasImages = productData?.images?.length > 0;
  const [selectedImage, setSelectedImage] = useState(
    hasImages ? productData.images[0].url : productData.mainImage,
  );
  const [thumbIndex, setThumbIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    (productData?.availableColors?.split(",") || [])[0]?.trim() || null,
  );
  const [selectedSize, setSelectedSize] = useState(
    (productData?.availableSizes?.split(",") || [])[0]?.trim() || null,
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewsToShow, setReviewsToShow] = useState(5);
  const [activeTab, setActiveTab] = useState("Product Details");

  const availableColors = (productData?.availableColors || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const availableSizes = (productData?.availableSizes || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const itemIdentifier = `${productData.id}-${selectedSize || "no-size"}-${selectedColor || "no-color"}`;
  const currentCartItem = cartItems.find((it) => it.id === itemIdentifier);
  const isInCart = !!currentCartItem;
  const isWishlisted = wishlist.some((it) => it.id === productData.id);
  const quantity = currentCartItem?.quantity || 1;
  const isUpdating = currentCartItem?.isUpdating || false;

  useEffect(() => {
    if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, fetchWishlist]);

  const reviewsData = productData?.reviews || [];
  const reviewsCount = reviewsData.length;
  const totalRating = reviewsData.reduce((s, r) => s + (r.rating || 0), 0);
  const averageRating =
    reviewsCount > 0 ? (totalRating / reviewsCount).toFixed(1) : 0;

  const priceFormatted = (n) =>
    typeof n === "number" ? n.toLocaleString("en-BD") : n;
  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to add to cart.");
      return;
    }
    if (productData.stockAmount <= 0) {
      toast.warn("This product is sold out.");
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      toast.warn("Please select a size.");
      return;
    }
    if (availableColors.length > 0 && !selectedColor) {
      toast.warn("Please select a color.");
      return;
    }
    setIsAdding(true);
    try {
      await addToCart(productData.id, 1, selectedSize, selectedColor);
    } catch {
      toast.error("Failed to add to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateQuantity = async (newQty) => {
    if (!currentCartItem || newQty < 1) return;
    await updateCartItemQuantity(
      currentCartItem.dbItemId,
      newQty,
      currentCartItem.id,
    );
  };

  const handleToggleWishlist = () => {
    if (!isLoggedIn) {
      toast.error("Please log in to add to wishlist.");
      return;
    }
    toggleWishlist(productData, isWishlisted);
    toast.success(
      isWishlisted ? "Removed from wishlist." : "Added to wishlist!",
    );
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productData.name,
          text: productData.shortdescription,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.info("Link copied to clipboard.");
      }
    } catch {
      toast.error("Could not share.");
    }
  };

  const onThumbClick = (url, idx) => {
    if (!url) return;
    setSelectedImage(url);
    setThumbIndex(idx);
  };

  const openImageModal = (images, index = 0) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
    if (images?.[index]) setSelectedImage(images[index]);
  };

  const onOpenGalleryModal = () => {
    setIsImageModalOpen(true);
    setCurrentImageIndex(thumbIndex || 0);
  };

  const addButtonDisabled =
    isAdding ||
    !isLoggedIn ||
    productData.stockAmount <= 0 ||
    (availableSizes.length > 0 && !selectedSize) ||
    (availableColors.length > 0 && !selectedColor);

  const discountPct = productData.discount > 0 ? productData.discount : null;
  const inStock = productData.stockAmount > 0;

  /* ── Purchase Panel (shared desktop + mobile) ── */
  const PurchasePanel = () => (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
          {productData.name}
        </h1>

        {/* Rating row */}
        <div className="flex items-center gap-2 mt-2">
          <StarRow rating={averageRating} />
          <span className="text-sm font-medium text-gray-700">
            {averageRating}
          </span>
          <span className="text-sm text-gray-400">
            ({reviewsCount} reviews)
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-100" />

      {/* Price block */}
      <div className="flex items-end gap-3 flex-wrap">
        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
          ৳{priceFormatted(productData.price)}
        </span>
        {productData.oldPrice > 0 && (
          <span className="text-base line-through text-gray-400 mb-0.5">
            ৳{priceFormatted(productData.oldPrice)}
          </span>
        )}
        {discountPct && (
          <span className="mb-1 px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100">
            -{discountPct}% OFF
          </span>
        )}
      </div>

      {/* Stock badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          inStock
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-700 border-red-100"
        }`}
      >
        {inStock ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <PackageX className="w-3.5 h-3.5" />
        )}
        {inStock ? `${productData.stockAmount} in stock` : "Out of stock"}
      </div>

      {/* Short description */}
      {productData.shortdescription && (
        <p className="text-sm text-gray-500 leading-relaxed">
          {productData.shortdescription}
        </p>
      )}

      {/* Color picker */}
      {availableColors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Color</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {selectedColor || "Select"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {availableColors.map((color, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color
                    ? "border-gray-800 scale-110 shadow-md"
                    : "border-transparent hover:border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color: ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size picker */}
      {availableSizes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Size</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {selectedSize || "Select"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`min-w-[2.5rem] px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedSize === size
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-dashed border-gray-100" />

      {/* Cart actions */}
      <div className="flex items-stretch gap-3">
        {productData.stockAmount <= 0 ? (
          <Button
            disabled
            className="flex-1 h-11 text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed rounded-xl"
          >
            Sold Out
          </Button>
        ) : isInCart ? (
          <div className="flex-1 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <button
              onClick={() => handleUpdateQuantity(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-40"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-base font-bold text-gray-900 w-10 text-center">
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                quantity
              )}
            </span>
            <button
              onClick={() => handleUpdateQuantity(quantity + 1)}
              disabled={isUpdating || quantity >= productData.stockAmount}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={addButtonDisabled}
            className="flex-1 h-11 rounded-xl text-sm font-semibold gap-2 transition-all active:scale-95"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Adding…
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </>
            )}
          </Button>
        )}

        <button
          onClick={handleToggleWishlist}
          className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-all ${
            isWishlisted
              ? "bg-red-50 border-red-200 text-red-500"
              : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
          }`}
          title="Wishlist"
        >
          <Heart
            className={`w-4.5 h-4.5 ${isWishlisted ? "fill-current" : ""}`}
          />
        </button>

        <button
          onClick={handleShare}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-gray-400 transition-all"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Go to cart / checkout */}
      {isInCart && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/cart">
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl text-sm"
            >
              View Cart
            </Button>
          </Link>
          <Link href="/checkout">
            <Button className="w-full h-10 rounded-xl text-sm">
              Checkout →
            </Button>
          </Link>
        </div>
      )}

      {!isLoggedIn && (
        <p className="text-center text-xs text-gray-400 pt-1">
          <Link
            href="/login"
            className="text-primary underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to add items to cart or wishlist.
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8 overflow-hidden">
          {[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/allproducts" },
            { label: productData.category?.name || "Category", href: null },
          ].map((crumb, i) => (
            <React.Fragment key={i}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-500 flex-shrink-0">
                  {crumb.label}
                </span>
              )}
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            </React.Fragment>
          ))}
          <span
            className="text-gray-700 font-medium truncate min-w-0"
            title={productData.name}
          >
            {productData.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ── LEFT: Gallery ── */}
          <div className="lg:col-span-7">
            <div className="flex gap-4">
              {/* Vertical thumbnails (desktop) */}
              {hasImages && (
                <div className="hidden lg:flex flex-col gap-2.5 w-[76px] max-h-[540px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                  {productData.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => onThumbClick(img.url, idx)}
                      className={`relative flex-shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === img.url
                          ? "border-gray-800 shadow-md"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                      aria-label={`Image ${idx + 1}`}
                    >
                      <Image
                        src={img.url}
                        alt={`thumb ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 min-w-0">
                <div
                  className="relative w-full h-[420px] md:h-[520px] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm cursor-zoom-in group"
                  onClick={onOpenGalleryModal}
                >
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt={productData.name}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      No image available
                    </div>
                  )}
                  {/* Zoom hint */}
                  <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Mobile thumbnails */}
                {hasImages && (
                  <div className="mt-3 flex gap-2.5 lg:hidden overflow-x-auto pb-1">
                    {productData.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => onThumbClick(img.url, idx)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImage === img.url
                            ? "border-gray-800 shadow-sm"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`Image ${idx + 1}`}
                      >
                        <Image
                          src={img.url}
                          alt={`thumb ${idx}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile purchase panel */}
            <div className="lg:hidden mt-6">
              <PurchasePanel />
            </div>

            {/* ── Tabs ── */}
            <div className="mt-10">
              <div className="flex gap-0 border-b border-gray-100">
                {["Product Details", "Rating & Reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 pb-3 pt-1 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "text-gray-900"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                {/* ── Product Details (Quill content) ── */}
                {activeTab === "Product Details" && (
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: productData.description,
                    }}
                  />
                )}

                {/* ── Reviews tab ── */}
                {activeTab === "Rating & Reviews" && (
                  <div className="space-y-8">
                    {/* Summary bar */}
                    {reviewsCount > 0 && (
                      <div className="flex items-center gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-center">
                          <div className="text-4xl font-extrabold text-gray-900">
                            {averageRating}
                          </div>
                          <StarRow rating={averageRating} size="w-3.5 h-3.5" />
                          <div className="text-xs text-gray-400 mt-1">
                            {reviewsCount} reviews
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviewsData.filter(
                              (r) => Math.floor(r.rating) === star,
                            ).length;
                            const pct =
                              reviewsCount > 0
                                ? (count / reviewsCount) * 100
                                : 0;
                            return (
                              <div
                                key={star}
                                className="flex items-center gap-2 text-xs text-gray-500"
                              >
                                <span className="w-3 text-right">{star}</span>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-6 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <ReviewForm productId={productData.id} userId={userId} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reviewsData
                        .slice(0, reviewsToShow)
                        .map((review, idx) => (
                          <article
                            key={idx}
                            className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage
                                  src={review.user?.image}
                                  alt={review.user?.name || "User"}
                                />
                                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                  {review.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm text-gray-800 truncate">
                                    {review.user?.name || "Anonymous"}
                                  </span>
                                  <StarRow
                                    rating={review.rating}
                                    size="w-3 h-3"
                                  />
                                </div>
                                <span className="text-xs text-gray-400">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                              {review.content}
                            </p>

                            {review.images?.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {review.images.slice(0, 4).map((imgObj, i) => (
                                  <button
                                    key={i}
                                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100"
                                    onClick={() =>
                                      openImageModal(
                                        review.images.map((im) => im.url),
                                        i,
                                      )
                                    }
                                    aria-label={`Review image ${i + 1}`}
                                  >
                                    <Image
                                      src={imgObj.url}
                                      alt={`review ${i + 1}`}
                                      fill
                                      className="object-cover hover:scale-105 transition-transform"
                                    />
                                    {i === 3 && review.images.length > 4 && (
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                        +{review.images.length - 4}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </article>
                        ))}
                    </div>

                    {reviewsToShow < reviewsCount && (
                      <div className="text-center">
                        <Button
                          onClick={() => setReviewsToShow((p) => p + 5)}
                          variant="outline"
                          className="px-8 rounded-xl text-sm"
                        >
                          Load more reviews
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: sticky purchase panel (desktop only) ── */}
          <aside className="hidden lg:block lg:col-span-5">
            <div className="sticky top-24">
              <PurchasePanel />
            </div>
          </aside>
        </div>

        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={
            hasImages
              ? productData.images.map((i) => i.url)
              : [productData.mainImage]
          }
          initialIndex={currentImageIndex}
        />
      </div>
    </>
  );
}
