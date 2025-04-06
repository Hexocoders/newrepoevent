import { supabase } from './supabaseClient';

/**
 * Processes payment requests that are approved and 72+ hours old
 * Should be called by a scheduled job (e.g., cron, serverless function)
 */
export async function processAutomaticPayouts() {
  try {
    // Get current timestamp
    const now = new Date();
    
    // Calculate timestamp for 72 hours ago
    const payoutThreshold = new Date(now);
    payoutThreshold.setHours(payoutThreshold.getHours() - 72);
    
    // Format timestamp for Supabase query
    const payoutThresholdStr = payoutThreshold.toISOString();
    
    // Get all approved payment requests that are at least 72 hours old
    const { data: eligibleRequests, error: fetchError } = await supabase
      .from('payment_requests')
      .select(`
        *,
        profiles(first_name, last_name, email)
      `)
      .eq('status', 'approved')
      .lt('updated_at', payoutThresholdStr);
    
    if (fetchError) {
      throw fetchError;
    }
    
    const processingResults = [];
    
    // Process each eligible payment request
    for (const request of eligibleRequests) {
      try {
        // Call Paystack API to process the transfer
        // This is a placeholder - you would need to implement the actual API call
        const paystackResponse = await processPaystackTransfer(request);
        
        // Update the payment request status to 'completed'
        const { error: updateError } = await supabase
          .from('payment_requests')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', request.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Create a transaction record
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: request.user_id,
            amount: request.amount,
            status: 'completed',
            payment_method: 'bank_transfer',
            description: 'Automatic payout',
            reference: paystackResponse.reference
          });
          
        if (txError) {
          throw txError;
        }
        
        // Create a notification
        await supabase.rpc('create_notification', {
          p_title: 'Payout Processed',
          p_message: `Your payout request for $${request.amount} has been processed automatically.`,
          p_source: 'payment',
          p_source_id: request.id
        });
        
        processingResults.push({
          request_id: request.id,
          status: 'success',
          user_email: request.profiles?.email
        });
      } catch (requestError) {
        console.error(`Error processing request ${request.id}:`, requestError);
        
        processingResults.push({
          request_id: request.id,
          status: 'error',
          error: requestError.message,
          user_email: request.profiles?.email
        });
      }
    }
    
    return {
      processed: processingResults.length,
      results: processingResults
    };
  } catch (error) {
    console.error('Error in processAutomaticPayouts:', error);
    throw error;
  }
}

/**
 * Process a payment refund through Paystack
 * @param {string} transactionId - The original transaction ID
 * @param {number} amount - Refund amount (if partial)
 * @param {string} reason - Reason for refund
 */
export async function processRefund(transactionId, amount = null, reason = 'Event cancelled') {
  try {
    // Call Paystack API to process the refund
    const paystackResponse = await processPaystackRefund(transactionId, amount, reason);
    
    // Update the transaction status to 'refunded'
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_reason: reason
      })
      .eq('id', transactionId);
      
    if (updateError) {
      throw updateError;
    }
    
    return {
      success: true,
      reference: paystackResponse.data.reference
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

/**
 * Calculate platform fee for a given amount
 * @param {number} amount - The ticket or sale amount
 * @param {number} feePercentage - The fee percentage (default: 3%)
 * @returns {Object} - The calculated fee and customer amount
 */
export function calculatePlatformFee(amount, feePercentage = 3) {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    throw new Error('Invalid amount');
  }
  
  const fee = (numericAmount * feePercentage) / 100;
  const amountWithFee = numericAmount + fee;
  
  return {
    originalAmount: numericAmount,
    feePercentage,
    feeAmount: fee,
    amountWithFee,
    customerPays: amountWithFee
  };
}

/**
 * Initiates a refund through Paystack API
 * @param {string} paymentReference - The transaction reference to refund
 * @param {number} amount - The amount to refund
 * @param {string} reason - Reason for the refund
 * @returns {Object} - Response with refund status
 */
export async function initiatePaystackRefund(paymentReference, amount, reason = 'Event cancelled') {
  try {
    // Get the Paystack secret key from environment variables
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured');
    }
    
    // Real Paystack API call to initiate refund
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: paymentReference,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to kobo if provided
        merchant_note: reason,
      }),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Paystack refund failed:', responseData);
      return {
        success: false,
        error: responseData.message || 'Failed to process refund',
        paystackResponse: responseData
      };
    }
    
    console.log('Paystack refund successful:', responseData);
    
    return {
      success: true,
      paystackReference: responseData.data?.reference,
      paystackResponse: responseData
    };
  } catch (error) {
    console.error('Error initiating Paystack refund:', error);
    return {
      success: false,
      error: error.message || 'Error initiating refund',
    };
  }
}

// Placeholder functions for the actual payment processor API calls
// These would need to be implemented with actual API calls

async function processPaystackTransfer(request) {
  // This is a placeholder for the actual Paystack API call
  console.log(`[PLACEHOLDER] Processing transfer for request ${request.id}`);
  
  // In a real implementation, you would call the Paystack Transfers API
  // https://paystack.com/docs/api/transfer/
  
  // Simulate API response
  return {
    status: true,
    message: 'Transfer has been queued',
    data: {
      reference: `tr_${Math.random().toString(36).substring(2, 12)}`,
      amount: request.amount,
      recipient: request.recipient_code
    }
  };
}

async function processPaystackRefund(transactionId, amount, reason) {
  // Convert to a real Paystack API call
  return await initiatePaystackRefund(transactionId, amount, reason);
} 