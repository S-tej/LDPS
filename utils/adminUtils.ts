import { auth } from '../firebase/config';

/**
 * Check if the current user is an admin
 * @returns boolean indicating if the current user has admin privileges
 */
export const isAdmin = (): boolean => {
  const user = auth.currentUser;
  if (!user) return false;
  
  return user.email === 'admin123@gmail.com';
};

/**
 * Check if credentials match admin credentials
 * @param email - Email to check
 * @param password - Password to check
 * @returns boolean indicating if the credentials are for an admin account
 */
export const checkAdminCredentials = (email: string, password: string): boolean => {
  return email === 'admin123@gmail.com' && password === '12345678';
};
