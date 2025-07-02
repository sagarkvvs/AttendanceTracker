import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateForInput(dateString?: string): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
}

export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function getAttendanceColor(status: string): string {
  switch (status) {
    case 'present': return 'bg-emerald-100 text-emerald-800';
    case 'absent': return 'bg-red-100 text-red-800';
    case 'late': return 'bg-amber-100 text-amber-800';
    default: return 'bg-slate-100 text-slate-600';
  }
}

export function getAttendanceIcon(status: string): string {
  switch (status) {
    case 'present': return 'fas fa-check';
    case 'absent': return 'fas fa-times';
    case 'late': return 'fas fa-clock';
    default: return 'fas fa-question';
  }
}

export function calculateAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export function validateAcademicYear(yearName: string): boolean {
  const yearPattern = /^\d{4}-\d{2}$/;
  return yearPattern.test(yearName);
}
