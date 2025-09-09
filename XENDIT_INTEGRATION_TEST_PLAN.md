# Xendit Integration Test Plan

## Test Scenarios

### 1. Reservation Creation
- [ ] Create a new reservation through the booking flow
- [ ] Verify reservation is created in the database
- [ ] Verify customer is created in the database

### 2. Payment Creation with Xendit
- [ ] Select Xendit payment method (e.g., E-Wallet)
- [ ] Verify Xendit invoice is created
- [ ] Verify payment record is created in database
- [ ] Verify user is redirected to Xendit payment page

### 3. Payment Success Callback
- [ ] Simulate successful payment callback from Xendit
- [ ] Verify payment status is updated to 'completed'
- [ ] Verify reservation payment_status is updated to 'completed'

### 4. Payment Failure Callback
- [ ] Simulate failed payment callback from Xendit
- [ ] Verify payment status is updated to 'failed'
- [ ] Verify reservation payment_status is updated to 'failed'

### 5. Manual Payment Methods
- [ ] Select bank transfer payment method
- [ ] Verify payment record is created without Xendit invoice
- [ ] Verify user is redirected to bank transfer page

### 6. Admin Payment Management
- [ ] View payments in admin dashboard
- [ ] Verify payment details are displayed correctly
- [ ] Verify Xendit payment statuses are synchronized

## Test Data

### Sample Reservation
- Package: Basic Photography Session
- Date: 2025-10-15
- Time: 10:00
- Duration: 60 minutes
- Customer: John Doe (john@example.com, +6281234567890)
- Total Amount: IDR 500,000
- Down Payment: IDR 250,000 (50%)

### Test Payment Methods
1. Xendit E-Wallet
2. Xendit Bank Transfer
3. Xendit Credit Card
4. Manual Bank Transfer

## Expected Results

### Successful Payment Flow
1. Reservation created successfully
2. Xendit invoice generated
3. Payment record created with external_payment_id
4. User redirected to Xendit payment page
5. Payment completed in Xendit
6. Callback received and processed
7. Payment status updated to 'completed'
8. Reservation payment_status updated to 'completed'

### Failed Payment Flow
1. Reservation created successfully
2. Xendit invoice generated
3. Payment record created with external_payment_id
4. User redirected to Xendit payment page
5. Payment failed in Xendit
6. Callback received and processed
7. Payment status updated to 'failed'
8. Reservation payment_status updated to 'failed'

### Manual Payment Flow
1. Reservation created successfully
2. Payment record created without external_payment_id
3. User redirected to bank transfer page
4. Admin manually updates payment status when transfer is confirmed