'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabase';
import Image from 'next/image';

function CreateEventContent() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [albumImages, setAlbumImages] = useState([]);
  const [albumImageUrls, setAlbumImageUrls] = useState([]);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  
  const fileInputRef = useRef(null);
  const albumInputRef = useRef(null);

  // Handle file selection for cover image
  const handleCoverImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Convert file to base64 string (fallback if storage fails)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload cover image to Supabase Storage
  const uploadCoverImage = async () => {
    if (!coverImage) return null;
    
    setUploadingCover(true);
    try {
      console.log('Starting cover image upload...', coverImage);
      
      // Get user from localStorage instead of session
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please sign in again.');
      }
      
      const user = JSON.parse(userStr);
      console.log('User found for upload:', user.id);
      
      // Create a unique file name with user ID
      const fileExt = coverImage.name.split('.').pop();
      const fileName = `${user.id}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Upload directly to root of bucket
      
      console.log('Uploading to path:', filePath);
      
      // Try base64 storage directly
      try {
        console.log('Converting to base64 for reliable storage...');
        const base64String = await fileToBase64(coverImage);
        return base64String;
      } catch (base64Error) {
        console.error('Error converting to base64:', base64Error.message);
        throw base64Error;
      }
    } catch (error) {
      console.error('Error uploading cover image:', error.message);
      setError('Failed to upload cover image. Please try again.');
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle file selection for album images
  const handleAlbumImagesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Limit to 3 images max
      const newFiles = files.slice(0, 3 - albumImages.length);
      
      // Create preview URLs
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      
      // Update state
      setAlbumImages(prev => [...prev, ...newFiles].slice(0, 3));
      setAlbumImageUrls(prev => [...prev, ...newUrls].slice(0, 3));
    }
  };

  // Trigger album file input click
  const handleAlbumUploadClick = () => {
    albumInputRef.current.click();
  };

  // Remove an album image
  const handleRemoveAlbumImage = (index) => {
    setAlbumImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
    
    setAlbumImageUrls(prev => {
      const newUrls = [...prev];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Upload album images to Supabase Storage
  const uploadAlbumImages = async () => {
    if (albumImages.length === 0) return [];
    
    setUploadingAlbum(true);
    const uploadedUrls = [];
    
    try {
      console.log('Starting album images upload...', albumImages.length, 'images');
      
      // Get user from localStorage instead of session
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please sign in again.');
      }
      
      const user = JSON.parse(userStr);
      console.log('User found for album upload:', user.id);
      
      for (const image of albumImages) {
        try {
          console.log('Processing album image:', image.name);
          
          // Convert directly to base64 for reliable storage
          console.log('Converting album image to base64...');
          const base64String = await fileToBase64(image);
          uploadedUrls.push(base64String);
        } catch (imageError) {
          console.error('Error uploading album image:', imageError.message);
          // Continue with other images
        }
      }
      
      console.log('Completed album uploads, total successful:', uploadedUrls.length);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading album images:', error.message);
      setError('Failed to upload album images. Please try again.');
      return uploadedUrls; // Return any successfully uploaded images
    } finally {
      setUploadingAlbum(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user from localStorage (custom users table)
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Please sign in to create an event');
      }
      
      const user = JSON.parse(userStr);
      console.log('User found:', user);
      
      // Create event object with all form data
      const eventData = {
        user_id: user.id, // Use the custom user's ID
        name: eventName,
        description,
        category,
        address,
        city,
        state,
        country,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_public: isPublic,
        is_paid: isPaid,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Saving event data to Supabase...', eventData);
      
      // Insert event into events table with RLS bypass
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError.message);
        throw new Error('Failed to create event. Please try again.');
      }

      if (!eventResult) {
        throw new Error('No event data returned after creation');
      }

      console.log('Event created successfully:', eventResult);

      // If it's a paid event, create a ticket tier
      if (isPaid && eventResult.id) {
        try {
          const ticketTierData = {
            event_id: eventResult.id,
            name: 'Standard Ticket',
            description: 'Standard entry ticket',
            price: parseFloat(price) || 0,
            quantity: parseInt(quantity) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Creating ticket tier:', ticketTierData);
          
          const { error: ticketError } = await supabase
            .from('ticket_tiers')
            .insert([ticketTierData]);
            
          if (ticketError) {
            console.error('Error creating ticket tier:', ticketError.message);
            // Continue with event creation even if ticket tier creation fails
          } else {
            console.log('Ticket tier created successfully');
          }
        } catch (ticketError) {
          console.error('Error creating ticket tier:', ticketError.message);
          // Continue with event creation even if ticket tier creation fails
        }
      }

      // Process images in parallel
      const imagePromises = [];
      
      // Process cover image if selected
      if (coverImage) {
        const coverImagePromise = (async () => {
          try {
            console.log('Attempting to upload cover image...', coverImage.name);
            const coverImageUrl = await uploadCoverImage();
            console.log('Cover image upload result:', coverImageUrl ? 'Base64 data received (length: ' + coverImageUrl.length + ')' : 'Failed');
            
            if (coverImageUrl) {
              console.log('Saving cover image to event_images table...');
              const imageData = {
                event_id: eventResult.id,
                image_url: coverImageUrl,
                is_cover: true,
                created_at: new Date().toISOString()
              };
              
              console.log('Image data to insert:', { ...imageData, image_url: 'Base64 data (truncated)' });
              
              // Insert image with RLS bypass
              const { error: imageError } = await supabase
                .from('event_images')
                .insert([imageData]);
                
              if (imageError) {
                console.error('Error saving image data:', imageError.message);
              } else {
                console.log('Cover image saved successfully to database');
              }
            }
          } catch (imageError) {
            console.error('Error processing cover image:', imageError.message);
            // Continue with event creation even if image upload fails
          }
        })();
        
        imagePromises.push(coverImagePromise);
      }
      
      // Process album images if any
      if (albumImages.length > 0) {
        const albumImagesPromise = (async () => {
          try {
            console.log('Uploading album images...', albumImages.length, 'images');
            const albumUrls = await uploadAlbumImages();
            
            if (albumUrls.length > 0) {
              console.log('Saving album images to event_images table...', albumUrls.length, 'base64 URLs');
              const albumData = albumUrls.map(url => ({
                event_id: eventResult.id,
                image_url: url,
                is_cover: false,
                created_at: new Date().toISOString()
              }));
              
              console.log('Album data to insert:', albumUrls.length, 'images as base64');
              
              // Insert album images with RLS bypass
              const { error: albumError } = await supabase
                .from('event_images')
                .insert(albumData);
                
              if (albumError) {
                console.error('Error saving album data:', albumError.message);
              } else {
                console.log('Album images saved successfully to database');
              }
            }
          } catch (albumError) {
            console.error('Error with album images:', albumError.message);
          }
        })();
        
        imagePromises.push(albumImagesPromise);
      }
      
      // Wait for all image processing to complete (or fail)
      try {
        await Promise.allSettled(imagePromises);
        console.log('All image processing completed');
      } catch (imageProcessingError) {
        console.error('Error during image processing:', imageProcessingError.message);
        // Continue with redirection even if image processing fails
      }

      // Store the event ID in session storage for the review page
      sessionStorage.setItem('currentEventId', eventResult.id);
      
      // Navigate to review page
      router.push('/review-event');
    } catch (error) {
      console.error('Error creating event:', error.message);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add state to track active section
  const [activeSection, setActiveSection] = useState('upload-cover');
  
  // Function to handle section navigation
  const navigateToSection = (section) => {
    setActiveSection(section);
    
    // Scroll to the section
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">Create an event</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Last update</div>
              <div className="font-medium">Monday, June 06 | 06:42 AM</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium">Draft</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold uppercase text-sm text-gray-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li 
                  className={`${activeSection === 'upload-cover' ? 'text-pink-500 font-medium' : 'text-gray-700'} cursor-pointer hover:text-pink-500`}
                  onClick={() => navigateToSection('upload-cover')}
                >
                  Upload cover
                </li>
                <li 
                  className={`${activeSection === 'general-information' ? 'text-pink-500 font-medium' : 'text-gray-700'} cursor-pointer hover:text-pink-500`}
                  onClick={() => navigateToSection('general-information')}
                >
                  General information
                </li>
                <li 
                  className={`${activeSection === 'location-and-time' ? 'text-pink-500 font-medium' : 'text-gray-700'} cursor-pointer hover:text-pink-500`}
                  onClick={() => navigateToSection('location-and-time')}
                >
                  Location and time
                </li>
                <li 
                  className={`${activeSection === 'ticket' ? 'text-pink-500 font-medium' : 'text-gray-700'} cursor-pointer hover:text-pink-500`}
                  onClick={() => navigateToSection('ticket')}
                >
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold uppercase text-sm text-gray-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li 
                  className="text-gray-700 cursor-pointer hover:text-pink-500"
                  onClick={() => router.push('/review-event')}
                >
                  Review and Publish
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Upload Cover Section */}
              <div id="upload-cover" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">📷</span>
                    <h2 className="text-lg font-medium">Upload cover</h2>
                  </div>
                  <button type="button" className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">Upload the event cover to capture your audience&apos;s attention</p>
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleCoverImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Cover image preview or upload button */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center overflow-hidden relative"
                  onClick={handleUploadClick}
                >
                  {coverImageUrl ? (
                    <>
                      <Image 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          className="text-white font-medium bg-pink-500 px-3 py-1 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                        >
                          Change Image
                        </button>
                      </div>
                    </>
                  ) : uploadingCover ? (
                    <div className="text-pink-500 font-medium flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    <button type="button" className="text-pink-500 font-medium">Upload Image</button>
                  )}
                </div>
                
                {/* Image upload instructions */}
                <div className="mt-2 text-xs text-gray-500">
                  Click to upload. Recommended size: 1200 x 630 pixels. Max size: 5MB.
                </div>
              </div>
              
              {/* General Information Section */}
              <div id="general-information" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">ℹ️</span>
                    <h2 className="text-lg font-medium">General information</h2>
                  </div>
                  <button type="button" className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Make it catchy and memorable</p>
                    <input
                      type="text"
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Rock Revolt: A Fusion of Power and Passion"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Provide essential event details</p>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Choose a category for your event</p>
                    <div className="relative">
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none"
                      >
                        <option value="">Select a category</option>
                        <option value="music">Music</option>
                        <option value="sports">Sports</option>
                        <option value="arts">Arts & Culture</option>
                        <option value="food">Food & Drink</option>
                        <option value="business">Business</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-1">
                      Album
                    </label>
                    <p className="text-xs text-gray-500 mb-1">Upload images for your event (max 3)</p>
                    
                    {/* Hidden file input for album images */}
                    <input 
                      type="file" 
                      ref={albumInputRef}
                      onChange={handleAlbumImagesSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {/* Album image previews */}
                      {albumImageUrls.map((url, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-200 rounded-md relative overflow-hidden">
                          <Image 
                            src={url} 
                            alt={`Album image ${index + 1}`} 
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAlbumImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {/* Loading spinner for uploading */}
                      {uploadingAlbum && (
                        <div className="w-16 h-16 bg-gray-200 rounded-md relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Add more button */}
                      {albumImages.length < 3 && !uploadingAlbum && (
                        <div 
                          className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-pink-300"
                          onClick={handleAlbumUploadClick}
                        >
                          <button type="button" className="text-gray-400 hover:text-pink-500">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Click to upload. Max 3 images. Recommended size: 800 x 600 pixels. Max size: 5MB each.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location and Time Section */}
              <div id="location-and-time" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">📍</span>
                    <h2 className="text-lg font-medium">Location and time</h2>
                  </div>
                  <button type="button" className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Location */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Location</h3>
                    <p className="text-xs text-gray-500 mb-4">You can choose the location or pinpoint it on the map</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            State / Province
                          </label>
                          <div className="relative">
                            <select
                              id="state"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none"
                            >
                              <option value="">Select state</option>
                              <option value="AL">Alabama</option>
                              <option value="AK">Alaska</option>
                              <option value="CA">California</option>
                              <option value="NY">New York</option>
                              <option value="TX">Texas</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                          Country / Region
                        </label>
                        <div className="relative">
                          <select
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none"
                          >
                            <option value="">Select</option>
                            <option value="us">United States</option>
                            <option value="ca">Canada</option>
                            <option value="uk">United Kingdom</option>
                            <option value="au">Australia</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map */}
                    <div className="mt-4 h-48 bg-gray-200 rounded-md relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        Map will be displayed here
                      </div>
                      <button 
                        type="button" 
                        className="absolute top-2 right-2 bg-pink-500 text-white px-3 py-1 rounded-md text-sm hover:bg-pink-600"
                      >
                        Add location
                      </button>
                    </div>
                  </div>
                  
                  {/* Time */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Time</h3>
                    <p className="text-xs text-gray-500 mb-4">Choose the start and end time for your event</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">
                          Time Zone
                        </label>
                        <div className="relative">
                          <select
                            id="timeZone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none"
                          >
                            <option>PDT (GMT-0800) United States (Los Angeles)</option>
                            <option>EDT (GMT-0400) United States (New York)</option>
                            <option>GMT (GMT+0000) United Kingdom (London)</option>
                            <option>CET (GMT+0100) France (Paris)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="eventDate"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="startTime"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="endTime"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4">
                        <button 
                          type="button" 
                          className="bg-pink-100 text-pink-500 px-3 py-1 rounded-md text-sm hover:bg-pink-200 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add organizer
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Public/Private */}
                  <div className="flex space-x-8 pt-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="public"
                        name="visibility"
                        checked={isPublic}
                        onChange={() => setIsPublic(true)}
                        className="h-4 w-4 text-pink-500 focus:ring-pink-400"
                      />
                      <label htmlFor="public" className="ml-2 text-sm font-medium text-gray-700">
                        Public
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="private"
                        name="visibility"
                        checked={!isPublic}
                        onChange={() => setIsPublic(false)}
                        className="h-4 w-4 text-pink-500 focus:ring-pink-400"
                      />
                      <label htmlFor="private" className="ml-2 text-sm font-medium text-gray-700">
                        Private
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ticket Section */}
              <div id="ticket" className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 text-xl">🎟️</span>
                    <h2 className="text-lg font-medium">Ticket</h2>
                  </div>
                  <button type="button" className="text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Ticket Type */}
                  <div>
                    <div className="flex space-x-4 mb-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="paid"
                          name="ticketType"
                          checked={isPaid}
                          onChange={() => setIsPaid(true)}
                          className="h-4 w-4 text-pink-500 focus:ring-pink-400"
                        />
                        <label htmlFor="paid" className="ml-2 text-sm font-medium text-gray-700">
                          Paid
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="free"
                          name="ticketType"
                          checked={!isPaid}
                          onChange={() => setIsPaid(false)}
                          className="h-4 w-4 text-pink-500 focus:ring-pink-400"
                        />
                        <label htmlFor="free" className="ml-2 text-sm font-medium text-gray-700">
                          Free
                        </label>
                      </div>
                    </div>
                    
                    {/* Ticket Tiers */}
                    <div className="mb-6">
                      <div className="flex space-x-4 mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="tierOne"
                            className="h-4 w-4 text-pink-500 focus:ring-pink-400 rounded"
                          />
                          <label htmlFor="tierOne" className="ml-2 text-sm font-medium text-gray-700">
                            Tier one
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="tierTwo"
                            className="h-4 w-4 text-pink-500 focus:ring-pink-400 rounded"
                          />
                          <label htmlFor="tierTwo" className="ml-2 text-sm font-medium text-gray-700">
                            Tier two
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="vipTier"
                            className="h-4 w-4 text-pink-500 focus:ring-pink-400 rounded"
                          />
                          <label htmlFor="vipTier" className="ml-2 text-sm font-medium text-gray-700">
                            VIP tier
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quantity and Price */}
                    {isPaid && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="200"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                            Price $
                          </label>
                          <input
                            type="number"
                            id="price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="50"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Discounts */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Discounts</h3>
                      <p className="text-xs text-gray-500 mb-4">Set the conditions for your discounts</p>
                      
                      <div className="space-y-4">
                        {/* Early Bird */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="earlyBird"
                            className="h-4 w-4 text-pink-500 focus:ring-pink-400 rounded"
                          />
                          <label htmlFor="earlyBird" className="ml-2 text-sm font-medium text-gray-700">
                            Early bird buys
                          </label>
                          <div className="ml-4 flex items-center">
                            <input
                              type="number"
                              placeholder="number of days to qualify"
                              className="w-48 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                            />
                            <div className="relative ml-2">
                              <select
                                className="w-32 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none text-sm"
                              >
                                <option>discount</option>
                                <option>10% off</option>
                                <option>20% off</option>
                                <option>30% off</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Multiple Buys */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="multipleBuys"
                            className="h-4 w-4 text-pink-500 focus:ring-pink-400 rounded"
                          />
                          <label htmlFor="multipleBuys" className="ml-2 text-sm font-medium text-gray-700">
                            Multiple buys
                          </label>
                          <div className="ml-4 flex items-center">
                            <input
                              type="number"
                              placeholder="number of tickets to qualify"
                              className="w-48 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                            />
                            <div className="relative ml-2">
                              <select
                                className="w-32 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 appearance-none text-sm"
                              >
                                <option>discount</option>
                                <option>10% off</option>
                                <option>20% off</option>
                                <option>30% off</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sale Date */}
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Sale date</h3>
                      <p className="text-xs text-gray-500 mb-4">Set the sale time when your audience is able to purchase the tickets</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="saleStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="saleStartDate"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="saleStartTime" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="saleStartTime"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="saleEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="saleEndDate"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="saleEndTime" className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="saleEndTime"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Promotion */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-700">Promotion</h3>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="promotion" 
                            className="sr-only"
                          />
                          <label 
                            htmlFor="promotion"
                            className="block h-6 w-12 rounded-full bg-gray-200 cursor-pointer"
                          ></label>
                          <span 
                            className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || uploadingCover}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Next'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateEvent() {
  return <CreateEventContent />;
} 