import { supabase } from '../lib/supabase';

export interface CheckoutSessionRequest {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export const createCheckoutSession = async (request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('Authentication required');
  }

  const baseUrl = window.location.origin;
  const successUrl = request.successUrl || `${baseUrl}/success`;
  const cancelUrl = request.cancelUrl || `${baseUrl}/cancel`;

  const response = await Promise.race([
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: request.priceId,
        mode: request.mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Checkout session timeout')), 10000)
    )
  ]) as Response;

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  return await response.json();
};

export const getUserSubscription = async (): Promise<SubscriptionData | null> => {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Subscription fetch timeout')), 5000)
      )
    ]) as any;

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  // For now, we'll redirect to the Stripe checkout URL directly
  // In a production app, you might want to use Stripe.js for better UX
  const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
  window.location.href = checkoutUrl;
};