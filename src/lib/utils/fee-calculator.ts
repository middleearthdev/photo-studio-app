import { FEE_CONFIG } from '@/lib/config/fee-config';

/**
 * Calculate payment fees based on payment method configuration
 * @param amount - The base payment amount
 * @param feeType - Type of fee ('percentage' or 'fixed')
 * @param feePercentage - Percentage fee (for percentage-based fees)
 * @param feeAmount - Fixed fee amount (for fixed fees)
 * @param customerPaysFees - Whether customer pays the fees
 * @returns Object containing fee details
 */
export const calculatePaymentFee = (
  amount: number,
  feeType: string,
  feePercentage: number,
  feeAmount: number,
  customerPaysFees: boolean
): {
  feeAmount: number;
  totalAmount: number;
  netAmount: number;
} => {
  let calculatedFee = 0;
  
  // Calculate fee based on type
  if (feeType === 'fixed') {
    calculatedFee = feeAmount;
  } else {
    // Default to percentage calculation
    calculatedFee = Math.round(amount * (feePercentage || 0) / 100);
  }
  
  // Determine total amount based on configuration
  const totalAmount = customerPaysFees ? amount + calculatedFee : amount;
  
  // Net amount is what the studio receives
  const netAmount = amount - calculatedFee;
  
  return {
    feeAmount: calculatedFee,
    totalAmount: totalAmount,
    netAmount: netAmount
  };
};

/**
 * Format fee for display to customers
 * @param feeType - Type of fee ('percentage' or 'fixed')
 * @param feePercentage - Percentage fee
 * @param feeAmount - Fixed fee amount
 * @returns Formatted fee string
 */
export const formatFeeForDisplay = (
  feeType: string,
  feePercentage: number,
  feeAmount: number
): string => {
  if (feeType === 'fixed') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: FEE_CONFIG.CURRENCY,
      minimumFractionDigits: 0
    }).format(feeAmount);
  }
  return `${feePercentage.toFixed(FEE_CONFIG.FEE_PERCENTAGE_DECIMALS)}%`;
};