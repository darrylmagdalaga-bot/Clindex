export interface UserLoginListItem {
  UserID: number;
  Username: string;
  FullName: string;
  RoleID: number;
  RoleName?: string;
}

export interface AuthUser {
  UserID: number;
  Username: string;
  FullName: string;
  RoleID: number;
  RoleName: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function fetchLoginUsers(): Promise<UserLoginListItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login-list`);
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.warn('[authApi] Failed to fetch users from server, returning local list:', error);
    return [
      { UserID: 1, Username: 'admin', FullName: 'Juan Dela Cruz (Administrator)', RoleID: 1, RoleName: 'Administrator' },
      { UserID: 2, Username: 'developer', FullName: 'Darryl Magdalaga (Developer)', RoleID: 5, RoleName: 'Developer' },
      { UserID: 3, Username: 'encoder', FullName: 'Maria Santos (Encoder)', RoleID: 3, RoleName: 'Encoder' },
      { UserID: 4, Username: 'viewer', FullName: 'Pedro Reyes (Viewer)', RoleID: 4, RoleName: 'Viewer' },
    ];
  }
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[authApi] Login network error:', error);
    return {
      success: false,
      message: 'Unable to connect to the server.',
    };
  }
}
