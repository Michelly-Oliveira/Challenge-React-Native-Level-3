import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsOnStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsOnStorage) {
        setProducts(JSON.parse(productsOnStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productToIncrement = products.map(product => {
        if (product.id === id) {
          product.quantity++;
        }

        return product;
      });

      setProducts(productToIncrement);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productToDecrement = products.map(product => {
        if (product.id === id) {
          if (product.quantity > 0) {
            product.quantity -= 1;
          }
        }

        return product;
      });

      setProducts(productToDecrement);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const isProductOnCart = products.find(
        productOnCart => productOnCart.title === product.title,
      );

      if (isProductOnCart) {
        increment(product.id);
        return;
      }

      const productWithQuantity = {
        id: product.id,
        title: product.title,
        image_url: product.image_url,
        price: product.price,
        quantity: 1,
      };

      setProducts([...products, productWithQuantity]);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
