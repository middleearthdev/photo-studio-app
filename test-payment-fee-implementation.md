# Payment Fee Implementation Test Plan

## Test Cases

### 1. Percentage Fee Payment Method
- Create a payment method with 2% fee
- Verify that the fee is correctly calculated and displayed
- Check that the total amount includes the fee

### 2. Fixed Fee Payment Method
- Create a payment method with a fixed fee of IDR 5,000
- Verify that the fixed fee is correctly applied
- Check that the total amount includes the fixed fee

### 3. No Fee Payment Method
- Create a payment method with no fees (0%)
- Verify that no fee is displayed
- Check that the total amount equals the original DP amount

### 4. UI Display Tests
- Verify that fee information is clearly displayed in the payment method selection
- Check that the booking summary shows the fee breakdown
- Ensure that the payment page displays the correct total amount

## Implementation Checklist

### Booking Summary Page
- [x] Display payment fee when a payment method is selected
- [x] Calculate and display total amount with fees
- [x] Update payment method selection UI to show fees
- [x] Pass fee information to the payment page

### Payment Processing
- [x] Update Xendit API to include fees in payment amount
- [x] Update manual payment processing to include fees
- [x] Ensure fee tracking in payment records

### Payment Page
- [x] Display payment fee information
- [x] Show correct total payment amount

## Test Results

After implementing the payment fee feature, all test cases should pass:

1. Percentage fee payment methods correctly calculate and display fees
2. Fixed fee payment methods correctly apply and display fees
3. No-fee payment methods display correctly without any fee information
4. UI clearly shows fee breakdown to customers
5. Payment processing correctly includes fees in the charged amount
6. Payment records accurately track fees for reporting purposes