import { useState } from 'react';
import { usePayment } from '../hooks/usePayment';

/**
 * Example payment form component demonstrating Stripe integration placeholder
 *
 * This component shows how to use the usePayment hook for processing payments.
 * In a real implementation, this would be integrated with Stripe Elements
 * for secure card input handling.
 */
export function PaymentForm({ amount, currency = 'usd', onSuccess, onError }) {
  const { processPayment, isProcessing, error, clearError } = usePayment();

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  });

  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
    },
  });

  const handleCardChange = (field) => (e) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (error) clearError();
  };

  const handleBillingChange = (field) => (e) => {
    setBillingDetails(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const paymentData = {
        amount, // Amount in cents
        currency,
        card: cardDetails,
        billingDetails,
      };

      const result = await processPayment(paymentData);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      if (onError) {
        onError(err);
      }
    }
  };

  const formatAmount = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          Amount to pay: <strong>{formatAmount(amount)}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Number */}
        <div>
          <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
            Card Number
          </label>
          <input
            id="card-number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.number}
            onChange={handleCardChange('number')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="19"
            required
          />
        </div>

        {/* Expiration Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="exp-month" className="block text-sm font-medium text-gray-700 mb-1">
              Exp Month
            </label>
            <input
              id="exp-month"
              type="text"
              placeholder="MM"
              value={cardDetails.expMonth}
              onChange={handleCardChange('expMonth')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="2"
              required
            />
          </div>
          <div>
            <label htmlFor="exp-year" className="block text-sm font-medium text-gray-700 mb-1">
              Exp Year
            </label>
            <input
              id="exp-year"
              type="text"
              placeholder="YYYY"
              value={cardDetails.expYear}
              onChange={handleCardChange('expYear')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="4"
              required
            />
          </div>
        </div>

        {/* CVC */}
        <div>
          <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <input
            id="cvc"
            type="text"
            placeholder="123"
            value={cardDetails.cvc}
            onChange={handleCardChange('cvc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="4"
            required
          />
        </div>

        {/* Billing Details */}
        <div>
          <label htmlFor="billing-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name on Card
          </label>
          <input
            id="billing-name"
            type="text"
            placeholder="John Doe"
            value={billingDetails.name}
            onChange={handleBillingChange('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="billing-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="billing-email"
            type="email"
            placeholder="john@example.com"
            value={billingDetails.email}
            onChange={handleBillingChange('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay ${formatAmount(amount)}`}
        </button>
      </form>

      {/* Development Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>Development Mode:</strong> This is a placeholder payment form.
          In production, integrate with Stripe Elements for secure card processing.
        </p>
      </div>
    </div>
  );
}