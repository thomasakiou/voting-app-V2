export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin' | 'Voter';
  status: 'Active' | 'Inactive';
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  officeCode: string;
  code: string;
  status: 'Verified' | 'Pending' | 'Disqualified';
}

export interface Office {
  code: string;
  description: string;
  createdDate: string;
}

export interface ElectionResult {
  candidate: string;
  party: string;
  votes: number;
  percentage: number;
  avatar?: string;
}
