import { CefrLevel, StartPreference, UserRole } from '../enums/user.enums';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  currentLevel: CefrLevel;
  startPreference: StartPreference;
  hasPassword: boolean;
  placementAvailable: boolean;
}