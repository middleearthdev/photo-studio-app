# Payment Fee Handling Test Plan

## Test Scenarios

### 1. Studio-Paid Fees Mode (NEXT_PUBLIC_CUSTOMER_PAYS_FEES=false)

#### Configuration:
- Set `NEXT_PUBLIC_CUSTOMER_PAYS_FEES=false` in .env.local
- Set `NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS=true` in .env.local

#### Expected Behavior:
1. Customers pay the original booking amount (fees not added)
2. Fees are displayed to customers during booking
3. Studio receives booking amount minus payment processing fees
4. Payment records track both gross amount and net amount

#### Test Steps:
1. Configure a payment method with a 2.5% fee
2. Create a booking with a Rp 500,000 package
3. Select the payment method with fees
4. Verify customer sees:
   - Subtotal: Rp 500,000
   - Fee: Rp 12,500 (2.5%)
   - Total: Rp 500,000 (customer pays original amount)
5. Verify payment record shows:
   - Amount: Rp 500,000
   - Gateway fee: Rp 12,500
   - Net amount: Rp 487,500

### 2. Customer-Paid Fees Mode (NEXT_PUBLIC_CUSTOMER_PAYS_FEES=true)

#### Configuration:
- Set `NEXT_PUBLIC_CUSTOMER_PAYS_FEES=true` in .env.local
- Set `NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS=true` in .env.local

#### Expected Behavior:
1. Customers pay the booking amount plus fees
2. Fees are displayed to customers during booking
3. Studio receives full booking amount
4. Payment records track both gross amount and net amount

#### Test Steps:
1. Configure a payment method with a 2.5% fee
2. Create a booking with a Rp 500,000 package
3. Select the payment method with fees
4. Verify customer sees:
   - Subtotal: Rp 500,000
   - Fee: Rp 12,500 (2.5%)
   - Total: Rp 512,500 (customer pays amount + fee)
5. Verify payment record shows:
   - Amount: Rp 512,500
   - Gateway fee: Rp 12,500
   - Net amount: Rp 500,000

### 3. Hidden Fees Mode (NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS=false)

#### Configuration:
- Set `NEXT_PUBLIC_CUSTOMER_PAYS_FEES=false` or `true` (either mode)
- Set `NEXT_PUBLIC_DISPLAY_FEES_TO_CUSTOMERS=false` in .env.local

#### Expected Behavior:
1. Fees are not displayed to customers
2. Customer payment experience remains the same as configured mode
3. Studio still receives correct net amount

#### Test Steps:
1. Configure a payment method with a 2.5% fee
2. Create a booking with a Rp 500,000 package
3. Select the payment method with fees
4. Verify customer does NOT see fee information
5. Verify payment processing works according to customer-pays-fees setting

## Test Data

### Sample Payment Methods:
1. Credit Card (2.5% fee)
2. Bank Transfer (Rp 5,000 fixed fee)
3. E-Wallet (1.5% fee)

### Sample Booking:
- Package: Photography Session (Rp 500,000)
- DP Percentage: 50%
- DP Amount: Rp 250,000

## Verification Points

### Database Records:
- Payment.amount reflects the amount charged to customer
- Payment.gateway_fee reflects the processing fee
- Payment.net_amount reflects what the studio receives

### Xendit Integration:
- Invoice amount sent to Xendit matches customer charge
- Fee calculation matches configured payment method

### UI Display:
- Fee information displayed according to configuration
- Total amounts calculated correctly
- Currency formatting consistent