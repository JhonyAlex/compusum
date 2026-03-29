import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  wholesalePrice: number | null;
  minWholesaleQty: number;
  stockStatus: string;
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  cityId: string;
  notes: string;
}

const emptyCustomerInfo: CustomerInfo = {
  name: "",
  email: "",
  phone: "",
  company: "",
  cityId: "",
  notes: "",
};

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  checkoutOpen: boolean;
  customerInfo: CustomerInfo;
  savedCartUuid: string | null;

  // Actions
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  setSavedCartUuid: (uuid: string | null) => void;
  loadItems: (items: CartItem[]) => void;
  /** Persiste el carrito actual en el servidor (fire-and-forget, sin bloquear UI). */
  syncToServer: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      checkoutOpen: false,
      customerInfo: emptyCustomerInfo,
      savedCartUuid: null,

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existing = items.find((item) => item.product.id === product.id);

        if (existing) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [], savedCartUuid: null, customerInfo: emptyCustomerInfo });
      },

      setOpen: (open) => set({ isOpen: open }),
      setCheckoutOpen: (open) => set({ checkoutOpen: open }),

      setCustomerInfo: (info) => {
        set({ customerInfo: { ...get().customerInfo, ...info } });
      },

      setSavedCartUuid: (uuid) => set({ savedCartUuid: uuid }),

      loadItems: (items) => set({ items }),

      syncToServer: async () => {
        const { items, customerInfo } = get();
        if (items.length === 0) return;

        const body = {
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice:
              item.product.wholesalePrice ?? item.product.price ?? undefined,
          })),
          customerName: customerInfo.name || undefined,
          customerEmail: customerInfo.email || undefined,
          customerPhone: customerInfo.phone || undefined,
          customerCompany: customerInfo.company || undefined,
          cityId: customerInfo.cityId || undefined,
          notes: customerInfo.notes || undefined,
          action: 'save',
        };

        try {
          const res = await fetch('/api/carts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data?.uuid) {
              set({ savedCartUuid: data.data.uuid });
            }
          }
        } catch {
          // Silencioso: localStorage ya guardó los items
        }
      },
    }),
    {
      name: "compusum-cart",
      partialize: (state) => ({
        items: state.items,
        customerInfo: state.customerInfo,
        savedCartUuid: state.savedCartUuid,
      }),
    }
  )
);

// Selectores
export const getItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const getSubtotal = (state: CartState) =>
  state.items.reduce((sum, item) => {
    const price = item.product.wholesalePrice || item.product.price || 0;
    return sum + price * item.quantity;
  }, 0);
