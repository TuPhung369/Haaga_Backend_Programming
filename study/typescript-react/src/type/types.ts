export interface ApiError {
  httpCode?: number;
  message?: string;
}
export interface AuthResponse {
  code: number;
  result: {
    token: string;
    authenticated?: boolean;
  };
}

export interface IntrospectResponse {
  code: number;
  result: {
    valid: boolean;
  };
}

export interface GenericResponse {
  code: number;
  message?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  date: Date;
  description?: string;
  color: string;
  allDay?: boolean;
  resource?: unknown;
}

export interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  dob: string;
  email: string;
  roles: Role[];
}
// Response types
export interface UserResponse {
  code?: number;
  result: User;
}

export interface UsersResponse {
  code?: number;
  data: User[];
  message?: string;
}

export interface Role {
  name: string;
  description: string;
  color: string;
  permissions: Permission[];
}

// Response Single role for create/delete
export interface RoleResponse {
  code: number;
  result: Role;
  message?: string;
}

// Array of roles for getAll
export interface RolesResponse {
  code: number;
  result: Role[];
  message?: string;
}

export interface Permission {
  name: string;
  description: string;
  color: string;
}

// Response Single permission for create/delete
export interface PermissionResponse {
  code: number;
  result: Permission;
  message?: string;
}

// Array of permissions for getAll
export interface PermissionsResponse {
  code: number;
  result: Permission[];
  message?: string;
}

