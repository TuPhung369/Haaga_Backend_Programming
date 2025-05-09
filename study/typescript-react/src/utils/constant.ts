import { Role, Permission } from "../types/UserTypes";
// Define color arrays as string[]
export const COLORS: string[] = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#FF6699",
  "#66B3FF",
  "#FFAA99",
  "#FFCC00",
  "#FF6600",
  "#CC99FF",
  "#FF3366",
  "#00B3B3",
  "#FFFFFF",
  "#000000",
  "#1890FF",
  "#ffc069",
];

// Define RoleColor as string[]
export const RoleColor: string[] = [
  "#FF4D4F",
  "#1890FF",
  "#52C41A",
  "#FAAD14",
  "#13C2C2",
  "#722ED1",
  "#EB2F96",
  "#FA541C",
  "#2F54EB",
  "#A0D911",
];

// Define RoleOption with Roles type
export const RoleOption: Role[] = [
  { name: "USER", description: "User role", color: RoleColor[2] },
  { name: "ADMIN", description: "Admin role", color: RoleColor[0] },
  { name: "MANAGER", description: "Manager role", color: RoleColor[1] },
  { name: "DEVELOPER", description: "Developer role", color: RoleColor[3] },
  { name: "DESIGNER", description: "Designer role", color: RoleColor[4] },
  { name: "TESTER", description: "Tester role", color: RoleColor[5] },
  { name: "DEVOPS", description: "DevOps role", color: RoleColor[6] },
  { name: "SUPPORT", description: "Support role", color: RoleColor[7] },
];

// Define PermissionColor as string[]
export const PermissionColor: string[] = [
  "#FF4D4F",
  "#1890FF",
  "#52C41A",
  "#FAAD14",
  "#13C2C2",
  "#722ED1",
  "#EB2F96",
  "#FA541C",
  "#2F54EB",
  "#A0D911",
];

// Define PermissionOption with Permissions type
export const PermissionOption: Permission[] = [
  {
    name: "CREATE",
    description: "Create permission",
    color: PermissionColor[0],
  },
  { name: "READ", description: "Read permission", color: PermissionColor[1] },
  {
    name: "UPDATE",
    description: "Update permission",
    color: PermissionColor[2],
  },
  {
    name: "DELETE",
    description: "Delete permission",
    color: PermissionColor[3],
  },
  {
    name: "APPROVE",
    description: "Approve permission",
    color: PermissionColor[4],
  },
  {
    name: "MANAGE",
    description: "Manage permission",
    color: PermissionColor[5],
  },
  {
    name: "REJECT",
    description: "Reject permission",
    color: PermissionColor[6],
  },
  {
    name: "UPLOAD",
    description: "Upload permission",
    color: PermissionColor[7],
  },
  { name: "SHARE", description: "Share permission", color: PermissionColor[8] },
  {
    name: "DOWNLOAD",
    description: "Download permission",
    color: PermissionColor[9],
  },
];
export const PriorityOptions = [
  { value: "High", label: "High", textColor: "text-red-600" },
  { value: "Medium", label: "Medium", textColor: "text-blue-700" },
  { value: "Low", label: "Low", textColor: "text-black" },
];

// User status colors
export const USER_STATUS_COLORS = {
  ONLINE: "#52c41a", // Green for Online
  AWAY: "#faad14", // Yellow for Away
  BUSY: "#f5222d", // Red for Busy
  OFFLINE: "#8c8c8c", // Grey for Offline status indicator
  OFFLINE_AVATAR: "#d9d9d9", // Light grey for Offline avatar
};

