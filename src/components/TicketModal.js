'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaystackButton from './PaystackButton';
import { useRouter } from 'next/navigation';

export default function TicketModal({ event, isOpen, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isFreeEvent, setIsFreeEvent] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([]);

  // Generate ticket tiers based on the event
  useEffect(() => {
    if (event) {
      // Use event's ticket_tiers if available, otherwise create a single default tier
      let tiers = [];
      
      if (event.ticket_tiers?.length > 0) {
        tiers = event.ticket_tiers.map(tier => {
          // Convert price to number and ensure it's not NaN
          const price = typeof tier.price === 'string' ? 
            parseFloat(tier.price.replace(/[^\d.]/g, '')) : 
            parseFloat(tier.price) || 0;
          
          return {
            ...tier,
            price: price // Ensure price is a number
          };
        });
      } else {
        // Extract price from event.price if it's a string with currency symbol
        let price = 0;
        if (event.price) {
          price = typeof event.price === 'string' ? 
            parseFloat(event.price.replace(/[^\d.]/g, '')) :
            parseFloat(event.price) || 0;
        }
        
        tiers = [{ 
          id: 'default', 
          name: 'General Admission', 
          price: price
        }];
      }
      
      setTicketTiers(tiers);
      
      // Check if this is a free event - only if all tiers are exactly 0
      const allTiersAreFree = tiers.every(tier => tier.price === 0);
      setIsFreeEvent(allTiersAreFree);
    }
  }, [event]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setStep(1);
      setSelectedTickets(0);
      setTotalAmount(0);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      
      // Store event details in localStorage for the ticket generation
      if (typeof window !== 'undefined') {
        try {
          // Ensure we have a valid date string or timestamp
          const eventDate = event.date 
            ? (typeof event.date === 'object' ? event.date.toISOString() : event.date) 
            : new Date().toISOString();

          const eventDetails = {
            title: event.title || 'Event',
            date: eventDate,
            time: event.time || 'Time not available',
            location: event.location || 'Location not available',
            id: event.id,
            price: event.price
          };
          
          console.log('Storing event details in localStorage:', eventDetails);
          localStorage.setItem('currentEventDetails', JSON.stringify(eventDetails));
        } catch (err) {
          console.error('Error storing event details:', err);
        }
      }
    }
  }, [isOpen, event]);

  // Calculate total when selected tickets change
  useEffect(() => {
    let total = 0;
    if (event?.price && event.price !== 'Free') {
      // Remove currency symbol and commas, then parse as float
      const basePrice = parseFloat(event.price.replace(/[^\d.]/g, '')) || 0;
      total = basePrice * selectedTickets;
    }
    setTotalAmount(total);
    setIsFreeEvent(total === 0);
  }, [selectedTickets, event]);

  const handleClose = () => {
    setStep(1);
    setSelectedTickets(0);
    onClose();
  };

  const handleContinue = () => {
    if (selectedTickets > 0) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((acc, count) => acc + count, 0);
  };

  const getTicketNames = () => {
    return Object.keys(selectedTickets).map(tierId => {
      const tier = ticketTiers.find(t => t.id === tierId);
      return `${tier.name} x${selectedTickets[tierId]}`;
    }).join(', ');
  };

  // Function to get the selected ticket tier ID
  const getSelectedTicketTierId = () => {
    // If there's only one tier selected, return that tier's ID
    const tierIds = Object.keys(selectedTickets);
    if (tierIds.length === 1) {
      const tierId = tierIds[0];
      // If the ID is 'default', look up the actual tier ID from the ticketTiers array
      if (tierId === 'default') {
        // Try to find the first ticket tier for this event that has a valid UUID
        const validTier = ticketTiers.find(t => t.id !== 'default');
        if (validTier) {
          return validTier.id;
        }
        // If no valid tier found, return null - the API will handle finding a tier
        return null;
      }
      return tierId;
    }
    
    // If multiple tiers are selected, return the first one for now
    // In the future, you might want to handle multiple ticket tiers differently
    if (tierIds.length > 0) {
      const tierId = tierIds[0];
      // Handle 'default' ID
      if (tierId === 'default') {
        // Try to find the first ticket tier with a valid ID
        const validTier = ticketTiers.find(t => t.id !== 'default');
        if (validTier) {
          return validTier.id;
        }
        return null;
      }
      return tierId;
    }
    
    return null;
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return false;
    if (!formData.lastName.trim()) return false;
    if (!formData.email.trim() || !formData.email.includes('@')) return false;
    return true;
  };

  const handlePaymentSuccess = (reference) => {
    // Redirect to the success page with the reference
    router.push(`/payment/success?reference=${reference}`);
    onClose();
  };

  const handleFreeTicketSuccess = (reference) => {
    // Store the event title and details in localStorage before redirecting
    if (event) {
      const ticketData = JSON.parse(localStorage.getItem('tempTicketData') || '{}');
      ticketData.event_title = event.title || 'Event';
      ticketData.event_date = event.date;
      ticketData.event_time = event.time;
      ticketData.event_location = event.location;
      localStorage.setItem('tempTicketData', JSON.stringify(ticketData));
    }
    
    // Redirect to the ticket page directly
    router.push(`/tickets/${reference}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={handleClose} />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    {step === 1 ? 'Select Tickets' : 'Complete Your Purchase'}
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-1 text-white hover:bg-white/20 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-white/80">{event?.title}</p>
              </div>

              {step === 1 ? (
                // Step 1: Select Tickets
                <div className="px-6 py-4">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Tickets</h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-amber-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">General Admission</h5>
                            <p className="text-sm text-gray-500">{event?.price === 'Free' ? 'Free' : event?.price}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSelectedTickets(Math.max(0, selectedTickets - 1))}
                              className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-8 text-center font-medium">{selectedTickets}</span>
                            <button
                              onClick={() => setSelectedTickets(selectedTickets + 1)}
                              disabled={selectedTickets >= 1}
                              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                                selectedTickets >= 1 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {event?.ticketCount} tickets remaining
                        </div>
                        {selectedTickets >= 1 && (
                          <div className="mt-2 text-xs text-amber-600 font-medium">
                            Note: You can only purchase one ticket at a time.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Total tickets:</span>
                      <span className="font-medium text-gray-900">{selectedTickets}</span>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-medium text-gray-700">Total:</span>
                      <span className="text-lg font-bold text-amber-600">
                        {event?.price === 'Free' ? 'Free' : 
                          `₦${(parseFloat(event?.price.toString().replace(/[^\d.]/g, '')) * selectedTickets).toLocaleString()}`}
                      </span>
                    </div>
                    <button
                      onClick={handleContinue}
                      disabled={selectedTickets === 0}
                      className={`w-full rounded-xl py-3 px-4 text-center font-medium transition-all ${
                        selectedTickets === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:shadow-lg hover:-translate-y-0.5 transform'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Purchase Form
                <div className="px-6 py-4">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 mb-6">
                    <h5 className="font-medium text-gray-900 mb-2">Order Summary</h5>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>General Admission x{selectedTickets}</span>
                      <span>{event?.price === 'Free' ? 'Free' : 
                        `₦${(parseFloat(event?.price.toString().replace(/[^\d.]/g, '')) * selectedTickets).toLocaleString()}`}</span>
                    </div>
                    <div className="text-xs text-gray-500">For: {event?.title}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={handleBack}
                      className="flex-1 rounded-xl py-3 px-4 text-center font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <PaystackButton
                      amount={totalAmount}
                      email={formData.email}
                      firstName={formData.firstName}
                      lastName={formData.lastName}
                      phone={formData.phone}
                      ticketType="General Admission"
                      eventId={event?.id}
                      ticketTierId={getSelectedTicketTierId()}
                      disabled={!validateForm()}
                      onSuccess={handlePaymentSuccess}
                      onFreeSuccess={handleFreeTicketSuccess}
                      isFree={event?.price === 'Free'}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 