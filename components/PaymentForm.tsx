'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
  appealId: string;
  userId: string;
  paymentType: 'additional_appeal' | 'vehicle_addition';
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentFormComponent({ 
  appealId, 
  userId, 
  paymentType, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentFormProps) {
  const [processing, setProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appealId,
          userId,
          paymentType
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm payment with card element
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      onPaymentSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentDetails = () => {
    switch (paymentType) {
      case 'additional_appeal':
        return {
          title: 'Additional Appeal',
          description: 'Create another appeal for £5',
          amount: '£5.00'
        };
      case 'vehicle_addition':
        return {
          title: 'Add Vehicle',
          description: 'Add a new vehicle to your account for £3',
          amount: '£3.00'
        };
      default:
        return {
          title: 'Payment',
          description: 'Complete your payment',
          amount: '£5.00'
        };
    }
  };

  const { title, description, amount } = getPaymentDetails();

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700 mb-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-zinc-800 p-4 rounded-lg">
          <label className="block text-sm font-medium mb-2">Card Details</label>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{amount}</span>
          <button
            type="submit"
            disabled={!stripe || processing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !stripe || processing
                ? 'bg-zinc-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {processing ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </form>
      
      <p className="text-xs text-gray-500 mt-4">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormComponent {...props} />
    </Elements>
  );
}