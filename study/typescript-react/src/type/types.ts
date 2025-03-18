import { ErrorType } from "../services/baseService";
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
  httpStatus?: string;
  httpCode?: string;
  severity?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  isHandled?: boolean;
  field?: string;
  message?: string;
  status?: number;
  code?: number;
  metadata?: Record<string, unknown>;
  originalError?: unknown;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  field?: string;
  message?: string;
  originalError?: {
    response?: {
      data?: {
        message?: string;
        errors?: FieldError[];
      };
    };
  };
  metadata?: Record<string, unknown>;
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

export interface AuthError {
  message?: string;
  response?: { data?: { httpCode?: number; message?: string } };
}
// Input type for validation
export interface ValidationInput {
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dob?: string | Date; // Can be string or Date
  roles?: string[]; // Array of strings for roles
  email?: string;
  recaptchaToken?: string; // reCAPTCHA v3 token
  recaptchaV2Token?: string; // reCAPTCHA v2 token (when needed)
}

// Error type for validation results
export interface ValidationErrors {
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  dob?: string;
  roles?: string; // Single string for error message
  email?: string;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}
export interface IntrospectResponse {
  code: number;
  result: {
    valid: boolean;
  };
}

export interface RefreshTokenResponse {
  token: string;
  authenticated: boolean;
  refreshed: boolean;
}

export interface GenericResponse {
  code: number;
  message?: string;
}

export interface CalendarEvent {
  id: string;
  seriesId?: string;
  title: string;
  start: string | Date | number[];
  end: string | Date | number[];
  date: string | Date | number[];
  description?: string;
  color?: string;
  allDay?: boolean;
  repeat?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  isEventsInvalidated?: boolean;
  userId?: string;
  exceptions?: { originalStart: string }[];
  createdAt?: string | Date | number[];
}

export interface TaskKanban {
  id: string;
  title: string;
  description?: string;
  priority?: "High" | "Medium" | "Low";
  position: number;
  columnId: string;
  createdAt?: string;
}
export interface ColumnKanban {
  id: string;
  title: string;
  tasks: TaskKanban[];
  position?: number;
  boardId?: string;
}
export interface Board {
  id: string;
  title?: string;
  columns?: ColumnKanban[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface AuthState {
  token: string | null;
  isAuthenticated?: boolean;
  loginSocial?: boolean;
}
export interface KanbanState {
  columns: ColumnKanban[];
  editingTask: TaskKanban | null;
  userBoards?: Board[];
  isColumnsInvalidated: boolean;
  isEditingTaskInvalidated: boolean;
  userId: string;
  loading?: boolean;
  error?: string | null;
  activeBoard?: Board | null;
  boardId?: string | null;
  isLoading?: boolean;
  boardData?: KanbanBoardResponse | null;
}

export interface KanbanBoardResponse {
  id: string;
  title: string;
  userId: string;
  columns: ColumnKanban[];
  createdAt?: string;
}
export interface EmailChangeRequest {
  userId: string;
  currentEmail: string;
  newEmail: string;
  password: string;
  token: string;
}

export interface EmailVerificationRequest {
  userId: string;
  newEmail: string;
  verificationCode: string;
  token: string;
  useTotp?: boolean;
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
export interface CustomErrorData {
  isHandled?: boolean;
  field?: string;
  message?: string;
  originalError?: unknown;
  errorCode?: number;
  errorType?: ErrorType;
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
  active?: boolean;
  block?: boolean;
  timeTried?: number;
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

export interface AuthenticationInitResponse {
  requiresTotp: boolean;
  requiresEmailOtp: boolean;
  message: string;
}

export interface EmailOtpAuthenticationRequest {
  username: string;
  password: string;
  otpCode: string;
}

