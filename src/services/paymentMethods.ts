import { apiService } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodData {
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface PaymentMethodSearchParams {
  includeInactive?: boolean;
}

export class PaymentMethodService {
  async getPaymentMethods(params?: PaymentMethodSearchParams): Promise<PaymentMethod[]> {
    const response = await apiService.get<PaymentMethod[]>(API_ENDPOINTS.SETTINGS.PAYMENT_METHODS, {
      params,
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod> {
    const response = await apiService.get<PaymentMethod>(API_ENDPOINTS.SETTINGS.PAYMENT_METHOD_BY_ID(id));
    return response.data as PaymentMethod;
  }

  async createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const response = await apiService.post<PaymentMethod>(API_ENDPOINTS.SETTINGS.PAYMENT_METHODS, data);
    return response.data as PaymentMethod;
  }

  async updatePaymentMethod(id: string, data: Partial<CreatePaymentMethodData>): Promise<PaymentMethod> {
    const response = await apiService.put<PaymentMethod>(
      API_ENDPOINTS.SETTINGS.PAYMENT_METHOD_BY_ID(id),
      data
    );
    return response.data as PaymentMethod;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SETTINGS.PAYMENT_METHOD_BY_ID(id));
  }
}

export const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;
