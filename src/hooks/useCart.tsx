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
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyAdded = cart.find(product => product.id === productId)

      if(!productAlreadyAdded) {
        const {data:product} = await api.get<Product>(`products/${productId}`);
        const {data:stock} = await api.get<Stock>(`stock/${productId}`);

        if (stock.amount > 0) {
          setCart([...cart, {...product, amount: 1}]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));
          return
        }
      }
      if(productAlreadyAdded) {
        const {data:stock} = await api.get<Stock>(`stock/${productId}`);

        if(stock.amount > productAlreadyAdded.amount) {
          const updateCart = cart.map(cartItem => cartItem.id === productId ? {
            ...cartItem,
            amount: cartItem.amount + 1
          } : cartItem);

          setCart(updateCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
          return
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const checkingProductExists = cart.some(product => product.id === productId);
      if(!checkingProductExists) {
        toast.error('Erro na remo????o do produto');
        return
      } else {
        const updateCart = cart.filter(item => item.id !== productId);
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      }

    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error('Erro na altera????o de quantidade do produto');
        return;
      }

      const response = await api.get(`/stock/${productId}`);
      
      if (amount > response.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const checkingProductExists = cart.some(product => product.id === productId);
      if(!checkingProductExists) {
        toast.error('Erro na altera????o de quantidade do produto');
        return
      }

      const updateCart = cart.map(cartItem => cartItem.id === productId ? {
        ...cartItem,
        amount: amount
      } : cartItem);
      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));

    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
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
