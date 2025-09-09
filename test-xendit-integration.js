// Test script for Xendit integration
// Run with: node test-xendit-integration.js

const dotenv = require('dotenv');
dotenv.config();

async function testXenditIntegration() {
  try {
    console.log('Testing Xendit Integration...');
    
    // Test Xendit client initialization
    const { Xendit } = require('xendit-node');
    
    const xenditClient = new Xendit({
      secretKey: process.env.XENDIT_SECRET_KEY,
    });
    
    console.log('✓ Xendit client initialized');
    
    // Test Invoice API
    const { Invoice } = xenditClient;
    const invoice = new Invoice({});
    
    console.log('✓ Invoice API initialized');
    
    // Test creating a sample invoice
    const invoiceParams = {
      externalID: `test-invoice-${Date.now()}`,
      amount: 100000,
      description: 'Test Invoice',
      customer: {
        given_names: 'Test Customer',
        email: 'test@example.com',
        mobile_number: '+6281234567890',
      },
      successRedirectURL: 'http://localhost:3000/booking/success',
      failureRedirectURL: 'http://localhost:3000/booking/payment-failed',
      paymentMethods: ['BANK_TRANSFER'],
      currency: 'IDR',
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          price: 100000,
          category: 'Test',
        },
      ],
      callbackUrl: 'http://localhost:3000/api/webhooks/xendit',
    };
    
    const response = await invoice.createInvoice({
      data: invoiceParams,
    });
    
    console.log('✓ Sample invoice created successfully');
    console.log('Invoice ID:', response.id);
    console.log('Invoice URL:', response.invoice_url);
    console.log('Invoice Status:', response.status);
    
    // Test retrieving the invoice
    const retrievedInvoice = await invoice.getInvoice({
      invoiceID: response.id,
    });
    
    console.log('✓ Invoice retrieved successfully');
    console.log('Retrieved Invoice Status:', retrievedInvoice.status);
    
    console.log('\n🎉 All Xendit integration tests passed!');
    console.log('\nNext steps:');
    console.log('1. Update your .env.local with real Xendit credentials');
    console.log('2. Test the full booking flow with Xendit payments');
    console.log('3. Verify webhook handling works correctly');
    
  } catch (error) {
    console.error('❌ Xendit integration test failed:');
    console.error(error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Tip: Make sure you have set XENDIT_SECRET_KEY in your .env.local file');
    }
  }
}

// Run the test
testXenditIntegration();
