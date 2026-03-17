export const authProvider = {
  login: async ({ username, password }: { username: string; password: string }) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) throw new Error('Invalid credentials');

    const data = await response.json();

    if (data.user.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  checkAuth: async () => {
    if (!localStorage.getItem('auth_token')) throw new Error('Not authenticated');
  },

  checkError: async (error: any) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('auth_token');
      throw new Error('Session expired');
    }
  },

  getIdentity: async () => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return { id: user.id, fullName: user.name, avatar: undefined };
  },

  getPermissions: async () => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return user.role;
  },
};
