import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {            
      return JSON.parse(storagedCart);
    } else {
      return [];
    }
  });

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId);
      const response = await api.get(`/stock/${productId}`)
      const productInStock: Stock = response.data;      
      if (product) {
        if (product.amount < productInStock.amount) {
          product.amount += 1;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));   
          setCart([...cart]);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        if (productInStock.amount >= 0) {
          const response = await api.get(`/products/${productId}`);
          const newProduct: Product = response.data;                   
          if (newProduct) {
            const newItem = {
              id: newProduct.id,
              image: newProduct.image,
              price: newProduct.price,
              title: newProduct.title,
              amount: 1
            }
            localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newItem]));   
            setCart([...cart, newItem]);
          }  
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }        
      }            
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId);
      if (product) {
        const updatedCart = cart.filter(item => item.id !== productId);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));      
      } else {
        toast.error('Erro na remoção do produto');  
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const product = cart.find(item => item.id === productId);
      const response = await api.get(`/stock/${productId}`)
      const productInStock: Stock = response.data;
      if (product && productInStock) {
        if (productInStock.amount >= amount) {
          product.amount = amount;                 
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          setCart([...cart]);
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
