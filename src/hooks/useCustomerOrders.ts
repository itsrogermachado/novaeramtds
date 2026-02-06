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

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // RLS policy handles filtering by customer_email matching profiles.email
      // No need for manual filter - RLS ensures users only see their own orders
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
      }

      return (data || []) as unknown as CustomerOrder[];
    },
    staleTime: 0, // Always refetch to ensure fresh data per user
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
