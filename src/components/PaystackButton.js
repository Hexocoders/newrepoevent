'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function PaystackButton({
  amount,
  email,
  firstName,
  lastName,
  phone,
  ticketType,
  eventId,
  ticketTierId,
  disabled = false,
  onSuccess,
  onFreeSuccess,
  isFree = false
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  // Generate a unique reference for this transaction
  const reference = `tx_${uuidv4()}`;
  
  // Load Paystack script
  useEffect(() => {
    if (typeof window !== 'undefined' && !isFree) {
      // Check if script is already loaded
      if (!document.getElementById('paystack-script')) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.id = 'paystack-script';
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        document.body.appendChild(script);
        
        return () => {
          if (document.getElementById('paystack-script')) {
            document.body.removeChild(document.getElementById('paystack-script'));
          }
        };
      } else {
        setIsScriptLoaded(true);
      }
    }
  }, [isFree]);
  
  // Handler for payment
  const handlePayment = () => {
    if (disabled || isProcessing) return;
    
    // For free tickets, just show loading for visual feedback, then redirect to ticket page
    if (isFree) {
      console.log('Free ticket button clicked - showing loading state');
      setIsProcessing(true);
      
      // Create a temporary ticket with form data
      const ticketData = {
        event_id: eventId,
        reference,
        customer_email: email,
        customer_name: `${firstName} ${lastName}`,
        customer_phone: phone || '',
        ticket_type: ticketType || 'General Admission',
        price_paid: 0,
        status: 'active',
        purchase_date: new Date().toISOString()
      };
      
      // Fetch event details from localStorage if available
      if (typeof window !== 'undefined') {
        try {
          const eventDetailsStr = localStorage.getItem('currentEventDetails');
          if (eventDetailsStr) {
            const eventDetails = JSON.parse(eventDetailsStr);
            // Add event details to ticket data
            ticketData.event_title = eventDetails.title || 'Event';
            ticketData.event_date = eventDetails.date || new Date().toISOString();
            ticketData.event_time = eventDetails.time || '';
            ticketData.event_location = eventDetails.location || '';
          }
        } catch (e) {
          console.error('Error parsing event details from localStorage:', e);
        }
      }
      
      // Save ticket data to localStorage for the ticket page to use
      localStorage.setItem('tempTicketData', JSON.stringify(ticketData));
      
      // First save the ticket to the database
      console.log('Saving ticket to database with data:', ticketData);
      fetch('/api/save-free-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })
      .then(response => {
        if (!response.ok) {
          console.error(`API error: ${response.status}`);
          return response.json().then(errorData => {
            throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
          }).catch(jsonError => {
            throw new Error(`API responded with status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Ticket saved to database successfully:', data);
        
        // Only redirect after saving to database (or after timeout as fallback)
        setTimeout(() => {
          setIsProcessing(false);
          if (onFreeSuccess) {
            onFreeSuccess(reference);
          }
        }, 1000);
      })
      .catch(error => {
        console.error('Error saving ticket to database:', error);
        alert('Error saving ticket. Please try again.');
        setIsProcessing(false);
      });
      
      return;
    }
    
    if (!window.PaystackPop || !isScriptLoaded) {
      alert('Payment system is still loading. Please try again in a moment.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackKey) {
        throw new Error('Paystack public key not found');
      }

      console.log('Initializing Paystack payment with data:', {
        email,
        amount,
        eventId,
        ticketType,
        ticketTierId
      });
      
      // Get the selected quantity from localStorage or default to 1
      const selectedQuantity = localStorage.getItem('selectedTicketQuantity') 
        ? parseInt(localStorage.getItem('selectedTicketQuantity'), 10)
        : 1;

      // Calculate total amount with 3% fee
      const baseAmount = amount * selectedQuantity;
      const amountWithFee = baseAmount * 1.03; // Add 3% fee
      const payableAmount = Math.round(amountWithFee * 100); // Convert to kobo

      console.log(`Base amount: ${baseAmount}, With 3% fee: ${amountWithFee}`);

      // Initialize Paystack
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email,
        amount: payableAmount, // Amount with 3% fee in kobo
        currency: 'NGN',
        ref: reference,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          event_id: eventId,
          ticket_type: ticketType,
          ticket_tier_id: ticketTierId,
          original_amount: baseAmount, // Store original amount without fee
          custom_fields: [
            {
              display_name: "Event ID",
              variable_name: "event_id",
              value: eventId
            },
            {
              display_name: "Ticket Type",
              variable_name: "ticket_type",
              value: ticketType
            },
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${firstName} ${lastName}`
            },
            {
              display_name: "Ticket Tier ID",
              variable_name: "ticket_tier_id",
              value: ticketTierId
            },
            {
              display_name: "Phone Number",
              variable_name: "phone",
              value: phone || "Not provided"
            }
          ],
          quantity: selectedQuantity // Add quantity to metadata
        },
        callback: (response) => {
          console.log('Paystack payment successful:', response);
          setIsProcessing(false);
          
          // Save the ticket data
          const ticketData = {
            event_id: eventId,
            reference: response.reference,
            customer_email: email,
            customer_name: `${firstName} ${lastName}`,
            customer_phone: phone || '',
            ticket_type: ticketType,
            price_paid: amount,
            transaction_id: response.transaction,
            ticket_tier_id: ticketTierId,
            status: 'active',
            purchase_date: new Date().toISOString(),
            quantity: selectedQuantity
          };
          
          // Get event details from localStorage
          if (typeof window !== 'undefined') {
            try {
              const eventDetailsStr = localStorage.getItem('currentEventDetails');
              if (eventDetailsStr) {
                const eventDetails = JSON.parse(eventDetailsStr);
                ticketData.event_title = eventDetails.title;
                ticketData.event_date = eventDetails.date;
                ticketData.event_time = eventDetails.time;
                ticketData.event_location = eventDetails.location;
              }
            } catch (e) {
              console.error('Error parsing event details:', e);
            }
          }

          // Save ticket data to localStorage for the ticket page to use
          localStorage.setItem('paidTicketData', JSON.stringify(ticketData));
          console.log('Saved paid ticket data to localStorage:', ticketData);
          
          // Save the ticket
          fetch('/api/save-paid-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
          })
          .then(response => response.json())
          .then(data => {
            console.log('Ticket saved:', data);
            // Update localStorage with any additional data from server
            if (data.data) {
              const updatedTicketData = { ...ticketData, ...data.data };
              localStorage.setItem('paidTicketData', JSON.stringify(updatedTicketData));
            }
            if (onSuccess) {
              onSuccess(response.reference);
            }
          })
          .catch(error => {
            console.error('Error saving ticket:', error);
            alert('Error saving ticket. Please contact support.');
          });
        },
        onClose: () => {
          console.log('Payment cancelled');
          setIsProcessing(false);
        }
      });

      // Open payment modal
      handler.openIframe();
    } catch (error) {
      console.error('Error initializing Paystack:', error);
      alert('Failed to initialize payment system. Please try again.');
      setIsProcessing(false);
    }
  };
  
  const buttonClass = disabled || isProcessing
    ? "w-full px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-medium cursor-not-allowed"
    : "w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transform transition-all";
  
  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className={buttonClass}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : (
        isFree ? "Get Free Ticket" : "Complete Purchase"
      )}
    </button>
  );
}