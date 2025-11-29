// API Client for Voting System Backend
// Handles all communication with the FastAPI backend

const API_BASE_URL = 'https://vmi2848672.contaboserver.net/voting/api';

// Types for API requests/responses
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  fullname?: string;  // Backend returns "fullname" not "full_name"
  role?: string;
  username?: string;
}

export interface UserCreate {
  username: string;
  password: string;
}

export interface UserOut {
  id: number;
  username: string;
  full_name: string;
  phone?: string | null;
  role: 'super-admin' | 'admin' | 'voter';
  is_active?: boolean | null;
}

export interface UserUpdate {
  username?: string;
  full_name?: string;
  role?: 'super-admin' | 'admin' | 'voter';
  is_active?: boolean;
}

export interface OfficeCreate {
  office_code: string;
  description: string;
}

export interface OfficeResponse {
  id: number;
  office_code: string;
  description: string;
  created_at: string;
}

export interface OfficeUpdate {
  office_code: string;
  description: string;
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
  created_at: string;
}

export interface ChangePasswordRequest {
  username: string;
  old_password: string;
  new_password: string;
}

export interface VotingTimeResponse {
  id?: number;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export interface VotingTimeSet {
  start_time: string;
  end_time: string;
}

// Token management
class TokenManager {
  private static TOKEN_KEY = 'voting_access_token';

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
    headers['Authorization'] = `Bearer ${token}`;
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
  async login(username: string, password: string): Promise<TokenResponse> {
    // OAuth2 password flow requires form data
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(response.status, response.statusText, error);
    }

    const data = await response.json();
    TokenManager.setToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      TokenManager.clearToken();
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiFetch('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },



  getToken: () => TokenManager.getToken(),
  clearToken: () => TokenManager.clearToken(),
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
        ...(token && { Authorization: `Bearer ${token}` }),
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

  async resetPassword(username: string): Promise<void> {
    await apiFetch(`/reset-password/${username}`, {
      method: 'POST',
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
};

// Offices API
export const officesAPI = {
  async getAll(): Promise<OfficeResponse[]> {
    return apiFetch<OfficeResponse[]>('/offices/');
  },

  async getByCode(code: string): Promise<OfficeResponse> {
    return apiFetch<OfficeResponse>(`/offices/${code}?code=${code}`);
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
    return apiFetch<CandidateResponse>(`/candidates/${code}?code=${code}`);
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

  async delete(id: number): Promise<void> {
    await apiFetch(`/candidates/${id}`, { method: 'DELETE' });
  },
};

// Votes API
export const votesAPI = {
  async getAll(): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>('/votes/');
  },

  async getByUserId(userId: number): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>(`/votes/${userId}`);
  },

  async getByUsername(username: string): Promise<VoteResponse[]> {
    return apiFetch<VoteResponse[]>(`/votes/${username}`);
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

// Voting Time API
export const votingTimeAPI = {
  async getVotingTime(): Promise<VotingTimeResponse | null> {
    try {
      return await apiFetch<VotingTimeResponse>('/voting-time/');
    } catch (error) {
      // Return null if no voting time is set yet
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
};
