// Configuration for payment fee handling
// This configuration determines whether payment fees are:
// - Borne by the customer (added to the payment amount)
// - Borne by the studio (absorbed by the business)

export const FEE_CONFIG = {
  // When true, fees are added to the customer's payment amount
  // When false, fees are absorbed by the studio
  CUSTOMER_PAYS_FEES: process.env.NEXT_PUBLIC_CUSTOMER_PAYS_FEES === 'true',
  
  // When true, fees are displayed to customers during booking
  // When false, fees are hidden from customers
  DISPLAY_FEES_TO_CUSTOMERS: process.env.NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS === 'true',
  
  // Default currency for displaying fees
  CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'IDR',
  
  // Format for displaying fee percentages
  FEE_PERCENTAGE_DECIMALS: parseInt(process.env.NEXT_PUBLIC_FEE_PERCENTAGE_DECIMALS || '2', 10)
};

// Helper function to determine if fees should be added to customer payments
export const shouldCustomerPayFees = (): boolean => {
  return FEE_CONFIG.CUSTOMER_PAYS_FEES;
};

// Helper function to determine if fees should be displayed to customers
export const shouldDisplayFeesToCustomers = (): boolean => {
  return FEE_CONFIG.DISPLAY_FEES_TO_CUSTOMERS;
};

// Helper function to format fee display
export const formatFeeDisplay = (feeType: string, feePercentage: number, feeAmount: number): string => {
  if (feeType === 'fixed') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: FEE_CONFIG.CURRENCY,
      minimumFractionDigits: 0
    }).format(feeAmount);
  }
  return `${feePercentage.toFixed(FEE_CONFIG.FEE_PERCENTAGE_DECIMALS)}%`;
};