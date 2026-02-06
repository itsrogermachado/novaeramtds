import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeliveredItem {
  product_id: string;
  product_name: string;
  quantity: number;
  delivered_content: string[];
  post_sale_instructions?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CustomerOrder {
  id: string;
  customer_email: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  items: OrderItem[];
  delivered_items: DeliveredItem[];
  created_at: string;
  paid_at: string | null;
}

export function useCustomerOrders(showAllOrders: boolean = false) {
  return useQuery({
    queryKey: ['customer-orders', showAllOrders],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // Build query
      let query = supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      // When showAllOrders is false, filter by user's email
      // This ensures users (including admins) see only their own orders
      if (!showAllOrders && user.email) {
        query = query.eq('customer_email', user.email);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
      }

      return (data || []) as unknown as CustomerOrder[];
    },
    staleTime: 0, // Always refetch to ensure fresh data per user
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
