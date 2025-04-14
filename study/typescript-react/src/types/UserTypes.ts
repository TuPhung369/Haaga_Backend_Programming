// src/types/UserTypes.ts
// Types related to users, roles, and permissions

import { CalendarEvent } from "./CalendarTypes";

export interface ValidationInput {
  username: string;
  firstname: string;
  lastname: string;
  dob: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  roles?: string[];
  active?: boolean;
  block?: boolean;
  // New fields
  avatar?: string;
  position?: string;
  department?: string;
  education?: string;
  userStatus?: "online" | "away" | "busy" | "offline";
}

export interface Permission {
  name: string;
  description: string;
  color: string;
}

export interface PermissionResponse {
  code: number;
  result: Permission;
  message?: string;
}

export interface PermissionsResponse {
  code: number;
  result: Permission[];
  message?: string;
}

export interface Role {
  name: string;
  description: string;
  color: string;
  permissions?: Permission[];
}

export interface RoleResponse {
  code: number;
  result: Role;
  message?: string;
}

export interface RolesResponse {
  code: number;
  result: Role[];
  message?: string;
}

export interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  dob: string;
  email: string;
  roles: Role[];
  active?: boolean;
  block?: boolean;
  timeTried?: number;
  // New fields
  avatar?: string;
  position?: string;
  department?: string;
  education?: string;
  userStatus?: "online" | "away" | "busy" | "offline";
  totpSecurity?: {
    enabled: boolean;
    deviceName?: string;
    enabledDate?: string;
  };
}

export interface UserResponse {
  code?: number;
  result: User;
}

export interface UsersResponse {
  code?: number;
  data: User[];
  message?: string;
}

export interface UserState {
  userInfo: User | null;
  roles: Role[];
  allUsers: User[];
  permissions: Permission[];
  events: CalendarEvent[];
  isUserInfoInvalidated: boolean;
  isRolesInvalidated: boolean;
  isUsersInvalidated: boolean;
  isPermissionsInvalidated: boolean;
  isEventsInvalidated: boolean;
  loading?: boolean;
  authError?: string | null;
}

export interface QuantityChart {
  name: string;
  value: number;
}

export interface PercentChart {
  name: string;
  value: number;
}

export interface FilterDropdownProps {
  setSelectedKeys: (keys: React.Key[]) => void;
  selectedKeys: React.Key[];
  confirm: () => void;
  clearFilters?: () => void;
  close: () => void;
  visible: boolean;
}

