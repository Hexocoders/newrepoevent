import { NextResponse } from 'next/server';
import supabase from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Simple function to calculate the amount after 10% fee deduction
const calculateNetAmount = (price) => {
  const amount = parseFloat(price);
  if (isNaN(amount) || amount <= 0) return 0;
  
  // Deduct 10% fee
  return amount * 0.9; // 90% of original price
};

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { eventId, quantity = 1, buyerInfo, paymentReference = null, transactionId = null } = body;
    
    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Event ID is required' 
      }, { status: 400 });
    }
    
    if (!buyerInfo || !buyerInfo.name || !buyerInfo.email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Buyer information is required' 
      }, { status: 400 });
    }
    
    // Get current event data
    const { data: event, error: fetchError } = await supabase
      .from('private_events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (fetchError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch event details',
        error: fetchError.message
      }, { status: 404 });
    }
    
    // Check if tickets are available
    const availableTickets = event.quantity - (event.quantity_sold || 0);
    
    if (availableTickets < quantity) {
      return NextResponse.json({ 
        success: false, 
        message: `Only ${availableTickets} tickets available`
      }, { status: 400 });
    }
    
    // Generate a unique ticket ID
    const ticketId = uuidv4();
    
    // Generate a ticket code (first 8 characters of UUID without dashes, uppercase)
    const ticketCode = ticketId.replace(/-/g, '').substring(0, 8).toUpperCase();
    
    // Generate a reference number (current timestamp + random 4 digits)
    const referenceNumber = `EVT${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Use customer email if provided, otherwise use buyer email
    const customerEmail = buyerInfo.customerEmail || buyerInfo.email;
    
    // Current timestamp for purchase date
    const purchaseDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Calculate the ticket price and apply 10% fee deduction
    const fullTicketPrice = event.is_paid ? event.price : 0;
    const discountedPrice = calculateNetAmount(fullTicketPrice);
    
    // Calculate total price (still shown as full price to customer)
    const totalPrice = fullTicketPrice * quantity;
    
    // For logging/debugging only (not visible to customer)
    console.log(`Original price: ${fullTicketPrice}, After 10% fee: ${discountedPrice}`);
    console.log(`Customer sees and pays: ${totalPrice}, System stores: ${discountedPrice * quantity}`);
    
    // Insert the ticket record
    const { error: ticketError } = await supabase
      .from('private_event_tickets')
      .insert({
        id: ticketId,
        event_id: eventId,
        buyer_name: buyerInfo.name,
        buyer_email: buyerInfo.email,
        buyer_phone: buyerInfo.phone || null,
        customer_email: customerEmail,
        quantity: quantity,
        price_paid: discountedPrice, // Store 90% of the price (after 10% fee deduction)
        total_price: totalPrice, // Store full amount (what customer actually paid)
        payment_reference: paymentReference,
        ticket_code: ticketCode,
        reference: referenceNumber,
        transaction_id: transactionId,
        status: 'active',
        is_paid: event.is_paid,
        purchase_date: purchaseDate,
        event_data: {
          event_name: event.event_name,
          description: event.description,
          event_start_date: event.event_start_date,
          event_end_date: event.event_end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          address: event.address,
          city: event.city,
          state: event.state,
          country: event.country,
          cover_image_url: event.cover_image_url
        }
      });
    
    if (ticketError) {
      console.error('Failed to create ticket record:', ticketError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create ticket record',
        error: ticketError.message
      }, { status: 500 });
    }
    
    // Update the quantity_sold field
    const newQuantitySold = (event.quantity_sold || 0) + quantity;
    
    const { error: updateError } = await supabase
      .from('private_events')
      .update({ quantity_sold: newQuantitySold })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Failed to update quantity sold:', updateError);
      // We still want to continue even if this update fails,
      // as the ticket has been created
    }
    
    // Return success response with the ticket ID for redirection
    return NextResponse.json({ 
      success: true, 
      message: `Successfully purchased ${quantity} ticket(s)`,
      ticketsRemaining: event.quantity - newQuantitySold,
      ticketId: ticketId,
      ticketCode: ticketCode,
      reference: referenceNumber,
      redirectUrl: `/view-private-ticket?id=${ticketId}`
    });
    
  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error while processing ticket purchase',
      error: error.message
    }, { status: 500 });
  }
} 