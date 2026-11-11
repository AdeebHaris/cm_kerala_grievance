export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: 'CITIZEN' | 'CMO_ADMIN' | 'OFFICER';
  department_id?: string | null;
  department?: { name: string } | null;
}

export const getUser = (): User | null => {
  const u = localStorage.getItem('user');
  if (!u) return null;
  try {
    return JSON.parse(u) as User;
  } catch {
    return null;
  }
};

export const getToken = () => localStorage.getItem('token');

export const setAuth = (token: string, user: User) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => !!getToken();
