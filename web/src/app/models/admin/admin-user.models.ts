export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Student' | 'Admin';
  currentLevel: string;
  isActive: boolean;
  signIn: string;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  lessonsCompleted: number;
  certificates: number;
}