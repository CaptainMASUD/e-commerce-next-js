"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

function getStoredAuthToken() {
  try {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const cartCount = useMemo(() => {
    return (cart?.items || []).reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    );
  }, [cart]);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);

      const token = getStoredAuthToken();

      if (!token) {
        setCart({ items: [] });
        return { ok: false, auth: false };
      }

      const res = await fetch("/api/customer/cart", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        setCart({ items: [] });
        return { ok: false, auth: false };
      }

      if (!res.ok) {
        throw new Error("Failed to fetch cart");
      }

      const json = await res.json().catch(() => ({}));
      setCart(json?.cart || { items: [] });

      return { ok: true, cart: json?.cart || { items: [] } };
    } catch (error) {
      console.error("refreshCart error:", error);
      setCart({ items: [] });
      return { ok: false, error };
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async ({ productId, variantBarcode = "", qty = 1, snapshot = {} }) => {
      const safeQty = Math.max(1, Number(qty || 1));
      const prevCart = cart;

      setCart((prev) => {
        const prevItems = Array.isArray(prev?.items) ? prev.items : [];
        const idx = prevItems.findIndex(
          (item) =>
            String(item.product?._id || item.product) === String(productId) &&
            String(item.variantBarcode || "") === String(variantBarcode || "")
        );

        if (idx >= 0) {
          const nextItems = [...prevItems];
          nextItems[idx] = {
            ...nextItems[idx],
            qty: Number(nextItems[idx].qty || 0) + safeQty,
          };
          return { ...prev, items: nextItems };
        }

        return {
          ...prev,
          items: [
            ...prevItems,
            {
              product: productId,
              variantBarcode,
              qty: safeQty,
              title: snapshot.title || "",
              image: snapshot.image || "",
              unitPrice: snapshot.unitPrice || 0,
            },
          ],
        };
      });

      try {
        const token = getStoredAuthToken();

        if (!token) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const res = await fetch("/api/customer/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "add",
            productId,
            variantBarcode,
            qty: safeQty,
            snapshot,
          }),
        });

        if (res.status === 401) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error || "Failed to add to cart");
        }

        setCart(json?.cart || { items: [] });
        return { ok: true, cart: json?.cart };
      } catch (error) {
        console.error("addToCart error:", error);
        await refreshCart();
        return { ok: false, error };
      }
    },
    [cart, refreshCart]
  );

  const setCartQty = useCallback(
    async ({ productId, variantBarcode = "", qty }) => {
      const safeQty = Number(qty || 0);
      const prevCart = cart;

      setCart((prev) => {
        const prevItems = Array.isArray(prev?.items) ? prev.items : [];
        const nextItems = prevItems
          .map((item) => {
            const same =
              String(item.product?._id || item.product) === String(productId) &&
              String(item.variantBarcode || "") === String(variantBarcode || "");

            if (!same) return item;
            if (safeQty <= 0) return null;

            return {
              ...item,
              qty: safeQty,
            };
          })
          .filter(Boolean);

        return { ...prev, items: nextItems };
      });

      try {
        const token = getStoredAuthToken();

        if (!token) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const res = await fetch("/api/customer/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "setQty",
            productId,
            variantBarcode,
            qty: safeQty,
          }),
        });

        if (res.status === 401) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error || "Failed to update cart qty");
        }

        setCart(json?.cart || { items: [] });
        return { ok: true, cart: json?.cart };
      } catch (error) {
        console.error("setCartQty error:", error);
        await refreshCart();
        return { ok: false, error };
      }
    },
    [cart, refreshCart]
  );

  const removeFromCart = useCallback(
    async ({ productId, variantBarcode = "" }) => {
      const prevCart = cart;

      setCart((prev) => {
        const prevItems = Array.isArray(prev?.items) ? prev.items : [];
        const nextItems = prevItems.filter(
          (item) =>
            !(
              String(item.product?._id || item.product) === String(productId) &&
              String(item.variantBarcode || "") === String(variantBarcode || "")
            )
        );

        return { ...prev, items: nextItems };
      });

      try {
        const token = getStoredAuthToken();

        if (!token) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const res = await fetch("/api/customer/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "remove",
            productId,
            variantBarcode,
          }),
        });

        if (res.status === 401) {
          setCart(prevCart);
          return { ok: false, auth: false, message: "Login required" };
        }

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.error || "Failed to remove cart item");
        }

        setCart(json?.cart || { items: [] });
        return { ok: true, cart: json?.cart };
      } catch (error) {
        console.error("removeFromCart error:", error);
        await refreshCart();
        return { ok: false, error };
      }
    },
    [cart, refreshCart]
  );

  const clearCart = useCallback(async () => {
    const oldCart = cart;

    setCart((prev) => ({ ...prev, items: [] }));

    try {
      const token = getStoredAuthToken();

      if (!token) {
        setCart(oldCart);
        return { ok: false, auth: false, message: "Login required" };
      }

      const res = await fetch("/api/customer/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "clear",
        }),
      });

      if (res.status === 401) {
        setCart(oldCart);
        return { ok: false, auth: false, message: "Login required" };
      }

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to clear cart");
      }

      setCart(json?.cart || { items: [] });
      return { ok: true, cart: json?.cart };
    } catch (error) {
      console.error("clearCart error:", error);
      setCart(oldCart);
      await refreshCart();
      return { ok: false, error };
    }
  }, [cart, refreshCart]);

  const value = useMemo(() => {
    return {
      cart,
      setCart,
      cartCount,
      loading,
      initialized,
      refreshCart,
      addToCart,
      setCartQty,
      removeFromCart,
      clearCart,
    };
  }, [
    cart,
    cartCount,
    loading,
    initialized,
    refreshCart,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}