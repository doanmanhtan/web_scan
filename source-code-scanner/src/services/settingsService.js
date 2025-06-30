const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export const testToolConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      let errorData;
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to get scanners`);
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return { message: await response.text() };
    }
  } catch (error) {
    console.error(`Error getting scanners:`, error);
    throw error;
  }
}; 