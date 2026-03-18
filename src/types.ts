export type UserType = 'employee' | 'hr';

export interface User {
  id: string;
  email: string;
  company_name: string;
  user_type: UserType;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  request_number: string;
  amount: number;
  status: 'In attesa' | 'Approvato' | 'Erogato';
  created_at: string;
  updated_at: string;
}

export interface CompanyConfig {
  id: string;
  company_name: string;
  ragione_sociale?: string;
  piva?: string;
  numero_dipendenti?: number;
  referente_hr?: string;
  max_advance_percent: number;
  request_frequency: string;
  welcome_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Credentials {
  company: string;
  email: string;
  password: string;
}
