import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';
import { PaginatedResponse, User } from '../types';

export interface UserQueryParams {
  search?: string;
  role?: User['role'] | string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  // Frontend always validates password, but make it optional in the type so it can be omitted on updates.
  password?: string;
  role: User['role'];
  phone?: string;
  department?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  password?: string;
}

const ROLE_SLUGS: User['role'][] = [
  'admin',
  'receptionist',
  'doctor',
  'specialist',
  'nurse',
];

function normalizeRole(role?: string): User['role'] {
  if (!role) {
    return 'admin';
  }

  const normalized = role.trim().toLowerCase().replace(/\s+/g, '-');

  const matchedRole = ROLE_SLUGS.find((allowed) => allowed === normalized);
  if (matchedRole) {
    return matchedRole;
  }

  const enumNormalized = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const enumMap: Record<string, User['role']> = {
    ADMIN: 'admin',
    RECEPTIONIST: 'receptionist',
    DOCTOR: 'doctor',
    SPECIALIST: 'specialist',
    NURSE: 'nurse',
  };

  return enumMap[enumNormalized] ?? 'admin';
}

function serializeRole(role: User['role']): string {
  const map: Record<User['role'], string> = {
    admin: 'ADMIN',
    receptionist: 'RECEPTIONIST',
    doctor: 'DOCTOR',
    specialist: 'SPECIALIST',
    nurse: 'NURSE',
  };
  return map[role] ?? 'PATIENT';
}

function normalizeUser(user: any): User {
  if (!user) {
    throw new Error('Invalid user payload received from API');
  }

  const role = normalizeRole(user.role ?? user.roleCode);

  return {
    id: user.id,
    name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    email: user.email,
    role,
    roleCode: user.roleCode,
    doctorSpecialization: user.doctorSpecialization,
    specialistType: user.specialistType,
    avatar: user.avatar,
    phone: user.phone ?? user.phoneNumber,
    department: user.department,
    employeeId: user.employeeId,
    licenseNumber: user.licenseNumber,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  async getUsers(
    params?: UserQueryParams
  ): Promise<{
    users: User[];
    pagination?: PaginatedResponse<User>['pagination'];
  }> {
    const response = await apiService.get<User[]>(API_ENDPOINTS.USERS.BASE, {
      params,
    });

    const dataArray = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response as any).users)
        ? (response as any).users
        : [];

    return {
      users: dataArray.map(normalizeUser),
      pagination: response.pagination,
    };
  }

  async getMedicalStaff(
    params?: { role?: 'DOCTOR' | 'SPECIALIST' | 'NURSE'; limit?: number; page?: number }
  ): Promise<{
    users: User[];
    pagination?: PaginatedResponse<User>['pagination'];
  }> {
    const response = await apiService.get<User[]>(API_ENDPOINTS.USERS.MEDICAL_STAFF, {
      params,
    });

    const dataArray = Array.isArray(response.data)
      ? response.data
      : Array.isArray((response as any).users)
        ? (response as any).users
        : [];

    return {
      users: dataArray.map(normalizeUser),
      pagination: response.pagination,
    };
  }

  async getUser(id: string): Promise<User> {
    const response = await apiService.get<User>(
      API_ENDPOINTS.USERS.BY_ID(id)
    );

    const payload = response.data ?? response;
    return normalizeUser(payload);
  }

  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await apiService.post<User>(API_ENDPOINTS.USERS.BASE, {
      ...payload,
      role: serializeRole(payload.role),
    });
    const data = response.data ?? response;
    return normalizeUser(data);
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const response = await apiService.put<User>(API_ENDPOINTS.USERS.BY_ID(id), payload);
    const data = response.data ?? response;
    return normalizeUser(data);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    const response = await apiService.patch<User>(
      API_ENDPOINTS.USERS.UPDATE_STATUS(id),
      { isActive }
    );
    const data = response.data ?? response;
    return normalizeUser(data);
  }

  async deleteUser(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.USERS.BY_ID(id));
  }

  async searchUsers(
    params: UserQueryParams
  ): Promise<{
    users: User[];
    pagination?: PaginatedResponse<User>['pagination'];
  }> {
    return this.getUsers(params);
  }
}

export const userService = new UserService();
export default userService;

