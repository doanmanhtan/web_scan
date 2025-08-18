const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Get scanner paths from backend
 */
export const getScannerPaths = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get scanners' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to get scanners`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting scanner paths:', error);
    throw error;
  }
};

/**
 * Update scanner paths
 */
export const updateScannerPaths = async (updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update scanners' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to update scanners`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating scanner paths:', error);
    throw error;
  }
};

/**
 * Test scanner connection
 */
export const testScannerConnection = async (scannerName, path) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners/${scannerName}/test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to test connection' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to test connection`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error testing ${scannerName} connection:`, error);
    throw error;
  }
};

/**
 * Get all scanner configurations
 */
export const getAllScannerConfigs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners/configs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get scanner configs' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to get scanner configs`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting scanner configs:', error);
    throw error;
  }
};

/**
 * Reset scanner configurations to defaults
 */
export const resetScannerConfigs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to reset configs' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to reset configs`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error resetting scanner configs:', error);
    throw error;
  }
};

/**
 * Get current scanner paths (for debugging)
 */
export const getCurrentScannerPaths = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get current scanners' }));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to get current scanners`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting current scanner paths:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const testToolConnection = async () => {
  return getScannerPaths();
}; 