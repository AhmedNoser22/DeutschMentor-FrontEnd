import { IconName } from '../icon.component';

export interface NavItem {
  label: string;
  shortLabel: string;
  path: string;
  icon: IconName;
  adminOnly?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Today', shortLabel: 'Today', path: '/today', icon: 'home' },
  { label: 'Learn', shortLabel: 'Learn', path: '/learn', icon: 'learn' },
  { label: 'Review', shortLabel: 'Review', path: '/review', icon: 'review' },
  { label: 'Exams', shortLabel: 'Exams', path: '/exams', icon: 'exams' },
  { label: 'Certificates', shortLabel: 'Certs', path: '/certificates', icon: 'award' },
  { label: 'Admin', shortLabel: 'Admin', path: '/admin', icon: 'admin', adminOnly: true }
];