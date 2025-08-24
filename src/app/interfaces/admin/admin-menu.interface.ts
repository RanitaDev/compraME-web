// interfaces/admin/admin-menu.interface.ts
export interface AdminMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  isActive?: boolean;
  subItems?: AdminMenuSubItem[];
}

export interface AdminMenuSubItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  isActive?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin?: Date;
}
