export type UserRole = 'administrateur' | 'employe';

export interface UserAccount {
  id: string;
  identifier: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  createdAt: number;
}

export interface Session {
  userId: string;
  role: UserRole;
  identifier: string;
  issuedAt: number;
}

export interface AuthCredentials {
  identifier: string;
  password: string;
}

export interface RegisterCredentials {
  identifier: string;
  password: string;
  passwordConfirm: string;
}
