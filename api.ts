// API Client for Voting System Backend
// Handles all communication with the FastAPI backend

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://vmi2848672.contaboserver.net/voting/api';

// Types for API requests/responses
export interface LoginRequest {
  username: string;
  phone?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  fullname?: string;
  role?: string;
  username?: string;
}

export interface LoginOTPResponse {
  message: string;
  otp_sent: boolean;
  masked_email?: string;
  masked_phone?: string;
  has_email?: boolean;
  has_phone?: boolean;
  username?: string;
  full_name?: string;
}

export interface VerifyOTPRequest {
  username: string;
  otp_code: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface UserCreate {
  username: string;
  phone?: string;
  full_name?: string;
  email?: string;
  password?: string;
  role?: 'super-admin' | 'admin' | 'voter';
}

export interface UserOut {
  id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: 'super-admin' | 'admin' | 'voter';
  is_active?: boolean | null;
  is_accredited?: boolean | null;
  accredited_at?: string | null;
  accredited_device_id?: string | null;
  device_info?: string | null;
}

export interface UserUpdate {
  username?: string;
  full_name?: string;
  email?: string;
  role?: 'super-admin' | 'admin' | 'voter';
  is_active?: boolean;
}

export interface UserStatsOut {
  total_voters: number;
  accredited_voters: number;
  unaccredited_voters: number;
  eligible_voters: number;
  non_eligible_voters: number;
  active_voters: number;
  disabled_voters: number;
  total_votes_cast: number;
  turnout_percentage: number;
}

export interface OfficeCreate {
  office_code: string;
  description: string;
}

export interface OfficeResponse {
  id: number;
  office_code: string;
  description: string;
  is_disqualified?: boolean;
  created_at: string;
}

export interface OfficeUpdate {
  office_code?: string;
  description?: string;
  is_disqualified?: boolean;
}

export interface CandidateCreate {
  candidate_code: string;
  name: string;
  office_code: string;
}

export interface CandidateResponse {
  id: number;
  candidate_code: string;
  name: string;
  is_disqualified?: boolean;
  created_at: string;
  office: {
    office_code: string;
    description: string;
  };
}

export interface VoteCreate {
  candidate_code: string;
  office_code: string;
}

export interface VoteResponse {
  id: number;
  user_name: string;
  candidate_name: string;
  office_name: string;
  office_code?: string;
  candidate_code?: string;
  receipt_hash?: string;
  created_at: string;
}

export interface MyVoteResponse {
  id: number;
  office_code: string;
  office_name: string;
  candidate_code: string;
  candidate_name: string;
  receipt_hash?: string;
  created_at: string;
}

export interface MyStatsResponse {
  voter_name: string;
  username: string;
  total_offices: number;
  voted_count: number;
  remaining_count: number;
  is_completed: boolean;
  voted_office_codes: string[];
  votes: Array<{
    office_code: string;
    office_name: string;
    candidate_name: string;
    candidate_code: string;
    receipt_hash?: string;
    created_at: string;
  }>;
}

export interface VotingTimeResponse {
  id?: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VotingTimeOut {
  id?: number;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active: boolean;
  status: string;
  time_remaining?: number | null;
  message?: string | null;
}

export interface VotingTimeSet {
  start_time: string;
  end_time: string;
}

export interface AccreditationValidateResponse {
  username: string;
  full_name: string;
  is_accredited: boolean;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  masked_phone?: string | null;
  masked_email?: string | null;
  message?: string;
}

export interface AccreditationOTPResponse {
  message: string;
  otp_sent: boolean;
  masked_email?: string;
  masked_phone?: string;
  expires_in_minutes?: number;
}

export interface AccreditationVerifyResponse {
  message: string;
  accredited: boolean;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  masked_email?: string;
  masked_phone?: string;
}

export interface VoterContactLookupResponse {
  username: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  masked_email?: string | null;
  masked_phone?: string | null;
  has_email: boolean;
  has_phone: boolean;
  is_accredited: boolean;
  is_active: boolean;
  message?: string;
}

export interface VoterContactOTPResponse {
  message: string;
  otp_sent: boolean;
  masked_email?: string;
  masked_phone?: string;
  expires_in_minutes?: number;
}

export interface VoterContactVerifyResponse {
  message: string;
  verified: boolean;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  masked_email?: string;
  masked_phone?: string;
}

export interface VoterDisputeOut {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  current_email?: string | null;
  current_phone?: string | null;
  requested_email?: string | null;
  requested_phone?: string | null;
  dispute_type: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  admin_notes?: string | null;
  resolved_by?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AuditLog {
  id: number;
  admin_id?: number | null;
  admin_username: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  details?: string | null;
  created_at: string;
}

// Token management
class TokenManager {
  private static TOKEN_KEY = 'access_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

// API Error class
export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'APIError';
  }
}

// Base fetch wrapper with authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = TokenManager.getToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  // Add content-type for JSON requests
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    if (response.status === 401) {
      const detail = typeof errorData === 'object' && errorData?.detail ? errorData.detail : '';
      if (typeof detail === 'string' && detail.toLowerCase().includes('admin session expired')) {
        TokenManager.removeToken();
        localStorage.removeItem('access_token');
        localStorage.removeItem('voting_username');
        localStorage.removeItem('voting_fullname');
        localStorage.removeItem('fullname');
        localStorage.removeItem('voting_auth_role');
        alert('Your admin session has expired: A new login was initiated on another device.');
        window.location.href = '/#/admin/login';
      }
    }

    throw new APIError(response.status, response.statusText, errorData);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  async adminLogin(username: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    const data = await response.json();
    TokenManager.setToken(data.access_token);
    localStorage.setItem('access_token', data.access_token);
    if (data.fullname) {
      localStorage.setItem('fullname', data.fullname);
      localStorage.setItem('voting_fullname', data.fullname);
    }
    return data;
  },

  async login(username: string, phone?: string, deviceId?: string): Promise<LoginOTPResponse> {
    const payload: { username: string; phone?: string; device_id?: string } = { username };
    if (phone) payload.phone = phone;
    if (deviceId) payload.device_id = deviceId;

    const response = await fetch(`${API_BASE_URL}/election/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },

  async verifyOTP(username: string, otpCode: string, deviceId?: string): Promise<TokenResponse> {
    const payload: { username: string; otp_code: string; device_id?: string } = {
      username,
      otp_code: otpCode,
    };
    if (deviceId) payload.device_id = deviceId;

    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    const data = await response.json();
    TokenManager.setToken(data.access_token);
    if (data.fullname) {
      localStorage.setItem('fullname', data.fullname);
      localStorage.setItem('voting_fullname', data.fullname);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      TokenManager.clearToken();
    }
  },

  getToken: () => TokenManager.getToken(),
  clearToken: () => TokenManager.clearToken(),
};

// Accreditation API
export const accreditationAPI = {
  async validate(username: string): Promise<AccreditationValidateResponse> {
    const response = await fetch(`${API_BASE_URL}/accreditation/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },

  async sendOTP(username: string, phone?: string, email?: string): Promise<AccreditationOTPResponse> {
    const payload: { username: string; phone?: string; email?: string } = { username };
    if (phone) payload.phone = phone;
    if (email) payload.email = email;

    const response = await fetch(`${API_BASE_URL}/accreditation/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },

  async verifyOTP(
    username: string,
    otpCode: string,
    phone?: string,
    email?: string,
    deviceId?: string,
    deviceInfo?: string
  ): Promise<AccreditationVerifyResponse> {
    const payload: {
      username: string;
      otp_code: string;
      phone?: string;
      email?: string;
      device_id?: string;
      device_info?: string;
    } = {
      username,
      otp_code: otpCode,
    };
    if (phone) payload.phone = phone;
    if (email) payload.email = email;
    if (deviceId) payload.device_id = deviceId;
    if (deviceInfo) payload.device_info = deviceInfo;

    const response = await fetch(`${API_BASE_URL}/accreditation/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },
};

// Voter Contact & Dispute Management API
export const voterContactAPI = {
  async lookup(username: string): Promise<VoterContactLookupResponse> {
    const response = await fetch(`${API_BASE_URL}/voter-contact/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }
    return response.json();
  },

  async sendOTP(username: string, email?: string, phone?: string): Promise<VoterContactOTPResponse> {
    const payload: { username: string; email?: string; phone?: string } = { username };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    const response = await fetch(`${API_BASE_URL}/voter-contact/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }
    return response.json();
  },

  async verifyOTP(username: string, otpCode: string): Promise<VoterContactVerifyResponse> {
    const response = await fetch(`${API_BASE_URL}/voter-contact/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, otp_code: otpCode }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }
    return response.json();
  },

  async raiseDispute(data: {
    username: string;
    dispute_type?: string;
    requested_email?: string;
    requested_phone?: string;
    reason: string;
  }): Promise<VoterDisputeOut> {
    const response = await fetch(`${API_BASE_URL}/voter-contact/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }
    return response.json();
  },

  async getDisputes(status?: string): Promise<VoterDisputeOut[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<VoterDisputeOut[]>(`/voter-contact/disputes${query}`);
  },

  async resolveDispute(
    disputeId: number,
    data: { action: 'APPROVE' | 'REJECT'; admin_notes?: string }
  ): Promise<VoterDisputeOut> {
    return apiFetch<VoterDisputeOut>(`/voter-contact/disputes/${disputeId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Users API
export const usersAPI = {
  async createAdmin(data: UserCreate): Promise<UserOut> {
    return apiFetch<UserOut>('/users/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createVoter(data: UserCreate): Promise<UserOut> {
    return apiFetch<UserOut>('/users/voter', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async uploadCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/users/upload-csv`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: 'Bearer ' + token }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },

  async getAll(): Promise<UserOut[]> {
    return apiFetch<UserOut[]>('/users/');
  },

  async getAnalysis(): Promise<UserStatsOut> {
    return apiFetch<UserStatsOut>('/users/stats/analysis');
  },

  async getByUsername(username: string): Promise<UserOut> {
    return apiFetch<UserOut>(`/users/${username}?name=${username}`);
  },

  async delete(id: number): Promise<void> {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
  },

  async toggleStatus(userId: number, isActive: boolean): Promise<UserOut> {
    return apiFetch<UserOut>(`/users/${userId}/status?is_active=${isActive}`, {
      method: 'PATCH',
    });
  },

  async reverseAccreditation(userId: number): Promise<UserOut> {
    return apiFetch<UserOut>(`/users/${userId}/reverse-accreditation`, {
      method: 'PATCH',
    });
  },

  async update(id: number, data: UserUpdate): Promise<UserOut> {
    return apiFetch<UserOut>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async disableAllVoters(): Promise<void> {
    await apiFetch('/users/disable-voters', { method: 'PATCH' });
  },

  async enableAllVoters(): Promise<void> {
    await apiFetch('/users/enable-voters', { method: 'PATCH' });
  },

  async downloadCSV(filters?: { search?: string; role?: string; status?: string; accreditation?: string }): Promise<void> {
    const token = TokenManager.getToken();
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.accreditation && filters.accreditation !== 'all') params.append('accreditation', filters.accreditation);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${API_BASE_URL}/users/export/csv${query}`, {
      headers: { ...(token && { Authorization: 'Bearer ' + token }) },
    });
    if (!response.ok) throw new Error('Failed to download CSV');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neco_mcs_voters_list.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async downloadPDF(filters?: { search?: string; role?: string; status?: string; accreditation?: string }): Promise<void> {
    const token = TokenManager.getToken();
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.accreditation && filters.accreditation !== 'all') params.append('accreditation', filters.accreditation);
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await fetch(`${API_BASE_URL}/users/export/pdf${query}`, {
      headers: { ...(token && { Authorization: 'Bearer ' + token }) },
    });
    if (!response.ok) throw new Error('Failed to download PDF');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neco_mcs_voters_list.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async bulkDisqualifyCSV(file: File): Promise<{
    message: string;
    disqualified_count: number;
    disqualified_usernames: string[];
    not_found_count: number;
    not_found_usernames: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/users/bulk-disqualify`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: 'Bearer ' + token }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    return response.json();
  },
};

// Offices API
export const officesAPI = {
  async getAll(): Promise<OfficeResponse[]> {
    return apiFetch<OfficeResponse[]>('/offices/');
  },

  async getByCode(code: string): Promise<OfficeResponse> {
    return apiFetch<OfficeResponse>(`/offices/${code}`);
  },

  async create(data: OfficeCreate): Promise<OfficeResponse> {
    return apiFetch<OfficeResponse>('/offices/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: OfficeUpdate): Promise<OfficeResponse> {
    return apiFetch<OfficeResponse>(`/offices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async disqualify(id: number, isDisqualified: boolean): Promise<OfficeResponse> {
    return apiFetch<OfficeResponse>(`/offices/${id}/disqualify`, {
      method: 'PATCH',
      body: JSON.stringify({ is_disqualified: isDisqualified }),
    });
  },

  async delete(id: number): Promise<void> {
    await apiFetch(`/offices/${id}`, { method: 'DELETE' });
  },
};

// Candidates API
export const candidatesAPI = {
  async getAll(): Promise<CandidateResponse[]> {
    return apiFetch<CandidateResponse[]>('/candidates/');
  },

  async getByOfficeCode(officeCode: string): Promise<CandidateResponse[]> {
    return apiFetch<CandidateResponse[]>(`/candidates/${officeCode}/candidates`);
  },

  async getByCode(code: string): Promise<CandidateResponse> {
    return apiFetch<CandidateResponse>(`/candidates/${code}`);
  },

  async create(data: CandidateCreate): Promise<CandidateResponse> {
    return apiFetch<CandidateResponse>('/candidates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: CandidateCreate): Promise<CandidateResponse> {
    return apiFetch<CandidateResponse>(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async disqualify(id: number, isDisqualified: boolean): Promise<CandidateResponse> {
    return apiFetch<CandidateResponse>(`/candidates/${id}/disqualify`, {
      method: 'PATCH',
      body: JSON.stringify({ is_disqualified: isDisqualified }),
    });
  },

  async delete(id: number): Promise<void> {
    await apiFetch(`/candidates/${id}`, { method: 'DELETE' });
  },
};

// Votes API
export const votesAPI = {
  async getAll(): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>('/votes/');
  },

  async getMyVotes(): Promise<MyVoteResponse[]> {
    return apiFetch<MyVoteResponse[]>('/votes/my-votes');
  },

  async getMyStats(): Promise<MyStatsResponse> {
    return apiFetch<MyStatsResponse>('/votes/my-stats');
  },

  async getLive(): Promise<{ total_votes_cast: number; recent_votes: any[] }> {
    return apiFetch<{ total_votes_cast: number; recent_votes: any[] }>('/votes/live');
  },

  async getByUserId(userId: number): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>(`/votes/${userId}`);
  },

  async getByUsername(username: string): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>(`/votes/username/${username}`);
  },

  async getByCode(code: string): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>(`/votes/code/${code}`);
  },

  async cast(data: VoteCreate): Promise<VoteResponse> {
    return apiFetch<VoteResponse>('/votes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Results API
export const resultsAPI = {
  async getByOfficeCode(officeCode: string): Promise<any> {
    return apiFetch<any>(`/results/${officeCode}`);
  },

  async downloadOfficeCSV(officeCode: string): Promise<void> {
    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/results/export/${officeCode}`, {
      headers: { ...(token && { Authorization: 'Bearer ' + token }) },
    });
    if (!response.ok) throw new Error('Failed to download office votes CSV');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `votes_office_${officeCode}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

// System API
export const systemAPI = {
  async getAppStatus(): Promise<any> {
    return apiFetch<any>('/app');
  },

  async getConfig(): Promise<any> {
    return apiFetch<any>('/config');
  },
};

// Audit Logs API
export const auditLogsAPI = {
  async getAll(limit = 100, offset = 0, action?: string): Promise<AuditLog[]> {
    const actionQuery = action ? `&action=${encodeURIComponent(action)}` : '';
    return apiFetch<AuditLog[]>(`/audit-logs/?limit=${limit}&offset=${offset}${actionQuery}`);
  },

  async downloadCSV(): Promise<void> {
    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/audit-logs/export/csv`, {
      headers: { ...(token && { Authorization: 'Bearer ' + token }) },
    });
    if (!response.ok) throw new Error('Failed to download audit logs');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

// Voting Time & Start/Stop API
export const votingTimeAPI = {
  async getStatus(): Promise<VotingTimeOut> {
    const response = await fetch(`${API_BASE_URL}/voting-time/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch election status');
    }
    return response.json();
  },

  async getVotingTime(): Promise<VotingTimeResponse | null> {
    try {
      return await apiFetch<VotingTimeResponse>('/voting-time/');
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async setVotingTime(data: VotingTimeSet): Promise<VotingTimeResponse> {
    return apiFetch<VotingTimeResponse>('/voting-time/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async startVoting(): Promise<VotingTimeOut> {
    return apiFetch<VotingTimeOut>('/voting-time/start', {
      method: 'POST',
    });
  },

  async stopVoting(): Promise<VotingTimeOut> {
    return apiFetch<VotingTimeOut>('/voting-time/stop', {
      method: 'POST',
    });
  },
};
