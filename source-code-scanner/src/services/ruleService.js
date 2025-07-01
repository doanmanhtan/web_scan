// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// const getAuthHeaders = () => ({
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${localStorage.getItem('token')}`
// });

// // Lấy tất cả rules
// export const getRules = async () => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rules');
//   }
//   return response.json();
// };

// // Lấy rule theo ID để xem chi tiết
// export const getRuleById = async (ruleId) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rule details');
//   }
//   return response.json();
// };

// // Lấy rules theo category
// export const getRulesByCategory = async (category) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules?category=${category}`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rules by category');
//   }
//   return response.json();
// };

// // Lấy rules theo scanner/tool
// export const getRulesByScanner = async (scanner) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules?scanner=${scanner}`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rules by scanner');
//   }
//   return response.json();
// };

// // Lấy rules đã được enable
// export const getEnabledRules = async () => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules?enabled=true`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch enabled rules');
//   }
//   return response.json();
// };

// // Tạo rule mới
// export const createRule = async (rule) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(rule),
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to create rule');
//   }
//   return response.json();
// };

// // Cập nhật rule
// export const updateRule = async (ruleId, rule) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
//     method: 'PUT',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(rule),
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to update rule');
//   }
//   return response.json();
// };

// // Xóa rule
// export const deleteRule = async (ruleId) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(),
//   });
//   if (!response.ok) {
//     throw new Error('Failed to delete rule');
//   }
// };

// // Enable/Disable rule
// export const toggleRuleStatus = async (ruleId, enabled) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}/toggle`, {
//     method: 'PATCH',
//     headers: getAuthHeaders(),
//     body: JSON.stringify({ enabled }),
//   });
//   if (!response.ok) {
//     throw new Error('Failed to toggle rule status');
//   }
//   return response.json();
// };

// // Lấy thống kê rules
// export const getRuleStats = async () => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/stats`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rule statistics');
//   }
//   return response.json();
// };

// // Import rules từ file
// export const importRules = async (file) => {
//   const formData = new FormData();
//   formData.append('rules', file);
  
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/import`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${localStorage.getItem('token')}`
//     },
//     body: formData,
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to import rules');
//   }
//   return response.json();
// };

// // Export rules ra file
// export const exportRules = async (format = 'json') => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/export?format=${format}`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to export rules');
//   }
//   return response.blob();
// };

// // Validate rule content
// export const validateRule = async (ruleContent) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/validate`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify({ content: ruleContent }),
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to validate rule');
//   }
//   return response.json();
// };

// // Test rule trên sample code
// export const testRule = async (ruleId, sampleCode) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}/test`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify({ sampleCode }),
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to test rule');
//   }
//   return response.json();
// };

// // Lấy rule templates
// export const getRuleTemplates = async () => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/templates`, {
//     headers: getAuthHeaders()
//   });
//   if (!response.ok) {
//     throw new Error('Failed to fetch rule templates');
//   }
//   return response.json();
// };

// // Tạo rule từ template
// export const createRuleFromTemplate = async (templateId, customizations = {}) => {
//   const response = await fetch(`${API_BASE_URL}/api/settings/rules/templates/${templateId}/create`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(customizations),
//   });
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.message || 'Failed to create rule from template');
//   }
//   return response.json();
// }; 

// services/ruleService.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Helper function để xử lý response
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Nếu không parse được JSON, dùng statusText
    }
    throw new Error(errorMessage);
  }

  // Kiểm tra nếu response có content
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

// Lấy tất cả rules
export const getRules = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};


// Lấy rule theo ID để xem chi tiết
export const getRuleById = async (ruleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
      headers: getAuthHeaders()
    });

    if (response.status === 404) {
      // Có thể trả về null hoặc throw lỗi rõ ràng
      // return null;
      throw new Error('Rule not found');
    }

    return await handleResponse(response);
  } catch (error) {
    // Nếu là lỗi 404, có thể xử lý riêng
    if (error.message && error.message.includes('404')) {
      throw new Error('Rule not found');
    }
    console.error(`Error fetching rule ${ruleId}:`, error);
    throw error;
  }
};

// Lấy rules theo category
export const getRulesByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules?category=${encodeURIComponent(category)}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching rules by category ${category}:`, error);
    throw error;
  }
};

// Lấy rules theo scanner/tool
export const getRulesByScanner = async (scanner) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules?scanner=${encodeURIComponent(scanner)}`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error fetching rules by scanner ${scanner}:`, error);
    throw error;
  }
};

// Lấy rules đã được enable
export const getEnabledRules = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules?enabled=true`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching enabled rules:', error);
    throw error;
  }
};

// Tạo rule mới
export const createRule = async (rule) => {
  try {
    // Validate required fields
    if (!rule.name || !rule.name.trim()) {
      throw new Error('Rule name is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
};

// Cập nhật rule
export const updateRule = async (ruleId, rule) => {
  try {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error updating rule ${ruleId}:`, error);
    throw error;
  }
};

// Xóa rule
export const deleteRule = async (ruleId) => {
  try {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors for DELETE
      }
      throw new Error(errorMessage);
    }
    
    return true; // DELETE thành công
  } catch (error) {
    console.error(`Error deleting rule ${ruleId}:`, error);
    throw error;
  }
};

// Enable/Disable rule
export const toggleRuleStatus = async (ruleId, enabled) => {
  try {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }

    // Since the toggle endpoint doesn't exist, we'll use updateRule instead
    // First, we need to get the current rule data
    const currentRule = await getRuleById(ruleId);
    if (!currentRule) {
      throw new Error('Rule not found');
    }

    // Update the rule with the new enabled status
    const updatedRule = { ...currentRule, enabled };
    return await updateRule(ruleId, updatedRule);
  } catch (error) {
    console.error(`Error toggling rule ${ruleId} status:`, error);
    throw error;
  }
};

// Lấy thống kê rules
export const getRuleStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules/stats`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching rule statistics:', error);
    throw error;
  }
};

// Import rules từ file
export const importRules = async (file) => {
  try {
    if (!file) {
      throw new Error('File is required');
    }

    const formData = new FormData();
    formData.append('rules', file);
    
    const response = await fetch(`${API_BASE_URL}/api/settings/rules/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
        // Không set Content-Type cho FormData, browser sẽ tự set
      },
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error importing rules:', error);
    throw error;
  }
};

// Export rules ra file
export const exportRules = async (format = 'json') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules/export?format=${encodeURIComponent(format)}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors for blob responses
      }
      throw new Error(errorMessage);
    }
    
    return response.blob();
  } catch (error) {
    console.error('Error exporting rules:', error);
    throw error;
  }
};

// Validate rule content
export const validateRule = async (ruleContent) => {
  try {
    if (!ruleContent || !ruleContent.trim()) {
      throw new Error('Rule content is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content: ruleContent }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error validating rule:', error);
    throw error;
  }
};

// Test rule trên sample code
export const testRule = async (ruleId, sampleCode) => {
  try {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }
    if (!sampleCode || !sampleCode.trim()) {
      throw new Error('Sample code is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules/${ruleId}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sampleCode }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error testing rule ${ruleId}:`, error);
    throw error;
  }
};

// Lấy rule templates
export const getRuleTemplates = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/rules/templates`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching rule templates:', error);
    throw error;
  }
};

// Tạo rule từ template
export const createRuleFromTemplate = async (templateId, customizations = {}) => {
  try {
    if (!templateId) {
      throw new Error('Template ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/api/settings/rules/templates/${templateId}/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customizations),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`Error creating rule from template ${templateId}:`, error);
    throw error;
  }
};

// Scanner settings API functions
export const getScannerSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching scanner settings:', error);
    throw error;
  }
};

export const updateScannerSettings = async (scannerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/scanners`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scannerData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating scanner settings:', error);
    throw error;
  }
};

// System settings API functions
export const getSystemSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/system`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (systemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/system`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(systemData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// User settings API functions
export const getUserSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/user`, {
      headers: getAuthHeaders()
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/user`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};