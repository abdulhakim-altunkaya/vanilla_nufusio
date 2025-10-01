document.addEventListener('DOMContentLoaded', async () => {
  // Get provinceId from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const provinceId = urlParams.get('provinceId');
  
  if (!provinceId) {
    console.error('No provinceId in URL');
    return;
  }
  
  try {
    const response = await axios.get(`https://www.eumaps.org/api/kac-milyon/get-province/${provinceId}`);
    console.log('API Response:', response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
});