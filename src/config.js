// API configuration
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.qazaqcode.com' // Production URL (change this to your actual production URL)
  : 'http://localhost:5000'; // Development URL 