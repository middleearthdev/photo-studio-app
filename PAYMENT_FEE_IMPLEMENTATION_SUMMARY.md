# Payment Fee Handling Implementation Summary

## Overview
This implementation adds flexible payment fee handling to the Studio Foto App, allowing administrators to configure whether payment processing fees are:
1. Borne by the customer (added to the payment amount)
2. Borne by the studio (absorbed by the business)

Additionally, administrators can configure whether fees are displayed to customers during the booking process.

## Configuration

### Environment Variables
The fee handling behavior is controlled by two environment variables in `.env.local`:

1. `NEXT_PUBLIC_CUSTOMER_PAYS_FEES`
   - `true`: Customers pay the payment processing fees (fees added to payment amount)
   - `false`: Studio absorbs the payment processing fees (customers pay original amount)

2. `NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS`
   - `true`: Fees are displayed to customers during booking
   - `false`: Fees are hidden from customers

### Default Configuration
```
NEXT_PUBLIC_CUSTOMER_PAYS_FEES=false
NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS=true
```

This default configuration means studios absorb fees and fees are displayed to customers.

## Implementation Details

### 1. Configuration Files
- Created `src/lib/config/fee-config.ts` to manage fee handling configuration
- Added environment variables to `.env.local` and `.env.example`
- Created utility functions to read configuration

### 2. Fee Calculation
- Created `src/lib/utils/fee-calculator.ts` with functions to calculate fees
- Supports both percentage-based and fixed-amount fees
- Calculates total amount, fee amount, and net amount based on configuration

### 3. Payment Processing
- Updated `src/app/api/payments/xendit/route.ts` to handle both fee modes
- When `CUSTOMER_PAYS_FEES=true`: Amount sent to payment gateway includes fees
- When `CUSTOMER_PAYS_FEES=false`: Amount sent to payment gateway is the original booking amount
- Payment records track both gross amount and net amount received by studio

### 4. UI Updates
- Updated booking summary page to display fees based on configuration
- Updated payment page to show appropriate amounts and messaging
- Added configuration notice to admin payment methods page

### 5. Data Model
- Payment records now include `net_amount` field to track what the studio actually receives
- Fee information is properly tracked for reporting and reconciliation

## Fee Handling Modes

### Studio-Paid Fees Mode (Default)
- Configuration: `NEXT_PUBLIC_CUSTOMER_PAYS_FEES=false`
- Customer pays: Original booking amount
- Studio receives: Booking amount minus payment processing fees
- Example: 
  - Booking amount: Rp 500,000
  - Payment fee: 2.5% (Rp 12,500)
  - Customer pays: Rp 500,000
  - Studio receives: Rp 487,500

### Customer-Paid Fees Mode
- Configuration: `NEXT_PUBLIC_CUSTOMER_PAYS_FEES=true`
- Customer pays: Booking amount plus payment processing fees
- Studio receives: Full booking amount
- Example:
  - Booking amount: Rp 500,000
  - Payment fee: 2.5% (Rp 12,500)
  - Customer pays: Rp 512,500
  - Studio receives: Rp 500,000

## Testing
A comprehensive test plan is available in `PAYMENT_FEE_TEST_PLAN.md` to verify both fee handling modes work correctly.

## Benefits
1. **Flexibility**: Studios can choose how to handle payment processing fees
2. **Transparency**: Customers can see fees when configured to be displayed
3. **Financial Tracking**: Proper tracking of gross amounts, fees, and net amounts
4. **Easy Configuration**: Simple environment variable configuration
5. **Backward Compatibility**: Default configuration maintains existing behavior