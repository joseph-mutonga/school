const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// API request wrapper with authentication
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      removeAuthToken();
    }
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (data: { name?: string; avatar?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Students API
export const studentsAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; class?: string; stream?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/students?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/students/${id}`);
  },

  create: async (studentData: any) => {
    return apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  update: async (id: string, studentData: any) => {
    return apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest('/students/stats/overview');
  },
};

// Teachers API
export const teachersAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; department?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/teachers?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/teachers/${id}`);
  },

  create: async (teacherData: any) => {
    return apiRequest('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  },

  update: async (id: string, teacherData: any) => {
    return apiRequest(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/teachers/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest('/teachers/stats/overview');
  },
};

// Academic Records API
export const academicAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; subject?: string; class?: string; term?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/academic?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/academic/${id}`);
  },

  create: async (recordData: any) => {
    return apiRequest('/academic', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  },

  update: async (id: string, recordData: any) => {
    return apiRequest(`/academic/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/academic/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (params?: { term?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/academic/stats/overview?${queryParams}`);
  },

  getStudentHistory: async (studentId: string) => {
    return apiRequest(`/academic/student/${studentId}`);
  },
};

// Fee Management API
export const feesAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; term?: string; year?: string; paymentMethod?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/fees?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/fees/${id}`);
  },

  create: async (paymentData: any) => {
    return apiRequest('/fees', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  update: async (id: string, paymentData: any) => {
    return apiRequest(`/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/fees/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (params?: { term?: string; year?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/fees/stats/overview?${queryParams}`);
  },

  getStudentHistory: async (studentId: string) => {
    return apiRequest(`/fees/student/${studentId}`);
  },
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; class?: string; date?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/attendance?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/attendance/${id}`);
  },

  create: async (attendanceData: any) => {
    return apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  },

  bulkCreate: async (bulkData: any) => {
    return apiRequest('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },

  update: async (id: string, attendanceData: any) => {
    return apiRequest(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/attendance/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (params?: { date?: string; class?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/attendance/stats/overview?${queryParams}`);
  },

  getClassAttendance: async (className: string, date: string) => {
    return apiRequest(`/attendance/class/${encodeURIComponent(className)}/${date}`);
  },
};

// Library API
export const libraryAPI = {
  // Books
  getBooks: async (params?: { page?: number; limit?: number; search?: string; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/library/books?${queryParams}`);
  },

  getBookById: async (id: string) => {
    return apiRequest(`/library/books/${id}`);
  },

  createBook: async (bookData: any) => {
    return apiRequest('/library/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  },

  updateBook: async (id: string, bookData: any) => {
    return apiRequest(`/library/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  },

  deleteBook: async (id: string) => {
    return apiRequest(`/library/books/${id}`, {
      method: 'DELETE',
    });
  },

  // Book Issues
  getIssues: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/library/issues?${queryParams}`);
  },

  issueBook: async (issueData: any) => {
    return apiRequest('/library/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  },

  returnBook: async (issueId: string, fineAmount?: number) => {
    return apiRequest(`/library/issues/${issueId}/return`, {
      method: 'PUT',
      body: JSON.stringify({ fineAmount }),
    });
  },

  getStats: async () => {
    return apiRequest('/library/stats/overview');
  },

  getStudentHistory: async (studentId: string) => {
    return apiRequest(`/library/student/${studentId}`);
  },
};

// Reports API
export const reportsAPI = {
  getAcademicReport: async (params?: { term?: string; year?: string; class?: string; subject?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/reports/academic?${queryParams}`);
  },

  getFinancialReport: async (params?: { term?: string; year?: string; class?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/reports/financial?${queryParams}`);
  },

  getAttendanceReport: async (params?: { date?: string; class?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/reports/attendance?${queryParams}`);
  },

  getEnrollmentReport: async () => {
    return apiRequest('/reports/enrollment');
  },

  getLibraryReport: async () => {
    return apiRequest('/reports/library');
  },

  getDashboardReport: async () => {
    return apiRequest('/reports/dashboard');
  },
};

// Users API (Admin only)
export const usersAPI = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    return apiRequest(`/users?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deactivate: async (id: string) => {
    return apiRequest(`/users/${id}/deactivate`, {
      method: 'PUT',
    });
  },

  activate: async (id: string) => {
    return apiRequest(`/users/${id}/activate`, {
      method: 'PUT',
    });
  },

  resetPassword: async (id: string, newPassword: string) => {
    return apiRequest(`/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  getStats: async () => {
    return apiRequest('/users/stats/overview');
  },
};

export { getAuthToken, setAuthToken, removeAuthToken };