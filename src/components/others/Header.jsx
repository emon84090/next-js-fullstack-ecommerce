"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Menu,
  ChevronDown,
  MapPin,
  Tag,
  Home,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { useSession } from "next-auth/react";
import useWishlistStore from "@/lib/wishlistStore";
import HeaderSearchComponent from "@/components/others/AutoCompleteSearch";

import MobileBottomNav from "./header/MobileBottomNav";
import DesktopActions from "./header/DesktopActions";

const formatSlug = (name) => name.toLowerCase().replace(/\s/g, "-");

export function useWishlistWithSession() {
  const { status } = useSession();
  const store = useWishlistStore();

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && !initialized) {
      store.fetchWishlist();
      setInitialized(true);
    }
    if (status === "unauthenticated" && initialized) {
      setInitialized(false);
    }
  }, [status, initialized, store]);

  return store;
}

const coreMenuLinks = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/allproducts" },
  { name: "Contact", href: "/contact" },
];

const extendedLinks = [
  { name: "OFFERS", icon: Tag, href: "/offers" },
  { name: "OUR LOCATION", icon: MapPin, href: "/location" },
  { name: "VISIT OUR SHOWROOM", icon: MapPin, href: "/showroom" },
];

export default function EcommerceHeader() {
  const [activeTab, setActiveTab] = useState("menu");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(null);

  const searchInputRef = useRef(null);

  const router = useRouter();

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/categories", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        const { categories: data } = await response.json();

        const categoryNames = data.map((item) => ({
          name: item.name,
          slug: item.slug || formatSlug(item.name),
        }));

        setCategories(categoryNames);
        setCategoryError(null);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoryError("Failed to load categories.");
        toast.error("Failed to load product categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      const inputElement = searchInputRef.current.querySelector("input");
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [mobileSearchOpen]);

  const handleNavigation = (href) => router.push(href);

  const UTILITY_BAR_HEIGHT = "96px";

  const closeMobileSearch = () => setMobileSearchOpen(false);

  const categoryContent = loadingCategories ? (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Categories...
    </div>
  ) : categoryError ? (
    <div className="text-center text-red-500 py-4 text-sm">{categoryError}</div>
  ) : categories.length === 0 ? (
    <div className="text-center text-muted-foreground py-4 text-sm">
      No categories available.
    </div>
  ) : (
    categories.map((cat) => (
      <DropdownMenuItem
        key={cat.slug}
        className="text-base uppercase font-medium hover:bg-accent text-card-foreground cursor-pointer"
        onClick={() => handleNavigation(`/allproducts?categoryId=${cat.id}`)}
      >
        {cat.name}
      </DropdownMenuItem>
    ))
  );

  const mobileCategoryButtons = categories.map((cat) => (
    <SheetClose asChild key={cat.slug}>
      <Button
        variant="outline"
        className="justify-start truncate uppercase font-normal"
        onClick={() => handleNavigation(`/allproducts?categoryId=${cat.id}`)}
      >
        {cat.name}
      </Button>
    </SheetClose>
  ));

  return (
    <>
      <header
        className={`w-full bg-primary sticky top-0 z-[100] transition-shadow duration-300 ${
          scrolled ? "shadow-xl shadow-primary/40" : "shadow-md"
        }`}
      >
        <div
          className={`hidden md:block transition-all duration-500 ease-in-out bg-primary/90 z-[55] ${
            scrolled ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
          style={{
            maxHeight: scrolled ? "0px" : UTILITY_BAR_HEIGHT,
            overflow: "visible",
          }}
        >
          <div
            className={`flex items-center justify-between px-4 lg:px-10 max-w-7xl mx-auto py-6 ${
              scrolled ? "h-0 py-0" : "h-full"
            }`}
          >
            <Link
              href="/"
              className="text-3xl font-extrabold text-primary-foreground tracking-tight"
            >
              ShopEase
            </Link>

            <div className="flex-1 max-w-xl mx-8 ">
              <HeaderSearchComponent
                placeholder="Search thousands of products..."
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
              <DesktopActions />
            </div>
          </div>
        </div>

        <div
          className={`hidden md:flex items-center justify-between max-w-7xl mx-auto px-6 h-12 bg-primary/95 transition-all duration-300 ease-in-out ${
            scrolled ? "border-t-0" : "border-t border-primary-foreground/20"
          }`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-primary-foreground text-primary text-lg font-semibold px-6 rounded-none h-12 hover:bg-accent shadow-sm"
                disabled={loadingCategories}
              >
                {loadingCategories ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Menu className="h-5 w-5 mr-2" />
                )}
                All Categories
                {!loadingCategories && <ChevronDown className="h-5 w-5 ml-2" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60 uppercase mt-1 shadow-lg border border-border bg-card">
              {categoryContent}
            </DropdownMenuContent>
          </DropdownMenu>

          <ul className="flex gap-10 lg:gap-14 py-2 text-base font-semibold text-primary-foreground">
            {coreMenuLinks.map((link) => (
              <li
                key={link.name}
                className="hover:text-primary-foreground/80 transition cursor-pointer"
              >
                <Link href={link.href}>{link.name}</Link>
              </li>
            ))}
          </ul>

          <div className="text-sm font-medium text-primary-foreground/80 hidden lg:flex items-center">
            🚚 Free Shipping Over $50
          </div>
        </div>
      </header>

      <div
        className={`md:hidden ${
          scrolled ? "shadow-xl shadow-primary/40" : "shadow-md"
        } bg-primary sticky top-0 z-50`}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full p-0 bg-background">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="sr-only">Main Navigation</SheetTitle>
                  <h2 className="text-xl font-semibold text-primary">
                    Main Navigation
                  </h2>
                </SheetHeader>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-12 w-full p-0 bg-card border-b border-border">
                    <TabsTrigger
                      value="menu"
                      className="rounded-none font-bold text-lg h-full data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:mt-[1px] hover:bg-muted transition-colors"
                    >
                      Menu
                    </TabsTrigger>
                    <TabsTrigger
                      value="categories"
                      className="rounded-none font-bold text-lg h-full data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:mt-[1px] hover:bg-muted transition-colors"
                    >
                      Categories
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="menu" className="p-4 pt-0">
                    <ul className="space-y-1 py-4">
                      {coreMenuLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <li
                            className="text-lg font-semibold text-foreground hover:bg-accent p-2 rounded-md transition-colors cursor-pointer"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <div className="flex items-center gap-3">
                              <Home className="h-5 w-5 text-muted-foreground" />
                              {link.name}
                            </div>
                          </li>
                        </SheetClose>
                      ))}
                    </ul>
                    <Separator className="my-2" />
                    <ul className="space-y-1">
                      {extendedLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <li
                            className="text-base font-medium text-foreground hover:bg-accent p-2 rounded-md transition-colors cursor-pointer"
                            onClick={() => handleNavigation(link.href)}
                          >
                            <div className="flex items-center gap-3">
                              <link.icon className="h-5 w-5 text-muted-foreground" />
                              {link.name}
                            </div>
                          </li>
                        </SheetClose>
                      ))}
                    </ul>
                  </TabsContent>
                  <TabsContent value="categories" className="p-4 pt-0">
                    {loadingCategories ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                        <span className="text-primary font-medium">
                          Loading...
                        </span>
                      </div>
                    ) : categoryError ? (
                      <div className="text-center text-red-500 py-8 text-sm font-medium">
                        Failed to load categories.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 py-4">
                        {mobileCategoryButtons}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>

            <Link
              href="/"
              className="text-2xl font-extrabold text-primary-foreground tracking-tight"
            >
              ShopEase
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary/80"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open mobile search"
            >
              <Search className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[150] md:hidden transition-all duration-300 ease-in-out ${
          mobileSearchOpen
            ? "visible backdrop-blur-sm bg-background/95"
            : "invisible bg-transparent"
        }`}
        aria-modal={mobileSearchOpen}
        role="dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeMobileSearch();
          }
        }}
      >
        <div
          className={`absolute left-0 right-0 z-[160] bg-card p-4 shadow-xl transition-transform duration-300 ease-out border-b border-border ${
            mobileSearchOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <div className="flex-1 w-full" ref={searchInputRef}>
              <HeaderSearchComponent
                placeholder="Search thousands of products..."
                className="w-full"
                isMobile={true}
                onClose={closeMobileSearch}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-muted h-10 w-10 flex-shrink-0"
              onClick={closeMobileSearch}
              aria-label="Close search bar"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="pt-24 px-4 text-center">
          <p className="text-sm text-muted-foreground italic">
            {mobileSearchOpen ? "Start typing to see results." : ""}
          </p>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
