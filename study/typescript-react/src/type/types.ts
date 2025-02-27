export interface ApiError {
  code?: number;
  message?: string;
  httpStatus?: string;
  httpCode?: string;
  severity?: string;
}
export interface ExtendApiError extends ApiError {
  errorType?: "CREATE" | "FETCH" | "DELETE" | "UPDATE";
  details?: string;
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
  seriesId?: string;
  title: string;
  start: string | Date;
  end: string | Date;
  date: string | Date;
  description?: string;
  color?: string;
  allDay?: boolean;
  repeat?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  isEventsInvalidated?: boolean;
  userId?: string;
  exceptions?: { originalStart: string }[];
}
export interface TaskKanban {
  id: string;
  title: string;
  priority?: "High" | "Medium" | "Low";
}
export interface ColumnKanban {
  id: string;
  title: string;
  tasks: TaskKanban[];
}
export interface AuthState {
  token: string;
  isAuthenticated: boolean;
  loginSocial: boolean;
}
export interface KanbanState {
  columns: ColumnKanban[];
  editingTask: TaskKanban | null;
  isColumnsInvalidated: boolean;
  isEditingTaskInvalidated: boolean;
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
}

export interface RootState {
  auth: AuthState;
  user: UserState;
  kanban: KanbanState;
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
export interface Role {
  name: string;
  description: string;
  color: string;
  permissions?: Permission[];
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
export interface User {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  dob: string;
  email: string;
  roles: Role[];
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


