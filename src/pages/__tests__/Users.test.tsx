import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Users from '../Users';
import type { User } from '../../types';
import { vi } from 'vitest';

const mockUseApi = vi.fn();
const mockUseApiMutation = vi.fn();
const addNotificationMock = vi.fn();

vi.mock('../../hooks/useApi', () => ({
  useApi: (...args: unknown[]) => mockUseApi(...args),
  useApiMutation: (...args: unknown[]) => mockUseApiMutation(...args),
}));

vi.mock('../../contexts/NotificationContext', () => {
  return {
    useNotifications: () => ({
      addNotification: addNotificationMock,
    }),
  };
});

const createMutationMock = () => ({
  data: null,
  loading: false,
  error: null,
  mutate: vi.fn(),
  reset: vi.fn(),
});

describe('Users page', () => {
  const refetchMock = vi.fn();
  const inactiveUser: User = {
    id: 'user-inactive',
    name: 'Inactive User',
    email: 'inactive@example.com',
    role: 'nurse',
    isActive: false,
    department: 'Nursing',
    createdAt: '',
    updatedAt: '',
  };

  const activeUser: User = {
    id: 'user-active',
    name: 'Active Admin',
    email: 'active@example.com',
    role: 'admin',
    isActive: true,
    department: 'Operations',
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    addNotificationMock.mockReset();
    refetchMock.mockReset();
    mockUseApi.mockReset();
    mockUseApiMutation.mockReset();
  });

  function setupUsersPage(users: User[]) {
    mockUseApi.mockReturnValue({
      data: { users },
      loading: false,
      error: null,
      refetch: refetchMock,
    });

    mockUseApiMutation
      .mockReturnValueOnce(createMutationMock())
      .mockReturnValueOnce(createMutationMock());

    render(<Users />);
  }

  it('renders fetched users and filters by search', async () => {
    setupUsersPage([activeUser, inactiveUser]);

    expect(screen.getByText('Active Admin')).toBeInTheDocument();
    expect(screen.getByText('Inactive User')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search users...');
    await userEvent.type(searchInput, 'admin');

    expect(screen.getByText('Active Admin')).toBeInTheDocument();
    expect(screen.queryByText('Inactive User')).not.toBeInTheDocument();
  });

  it('activates an inactive user and triggers status mutation', async () => {
    const updateMutation = createMutationMock();
    const createMutation = createMutationMock();

    mockUseApi.mockReturnValue({
      data: { users: [inactiveUser] },
      loading: false,
      error: null,
      refetch: refetchMock,
    });

    mockUseApiMutation
      .mockReturnValueOnce(createMutation) // create user mutation
      .mockReturnValueOnce(updateMutation); // status mutation

    render(<Users />);

    const row = screen.getByText('Inactive User').closest('tr');
    expect(row).toBeInTheDocument();
    const activateButton = within(row as HTMLTableRowElement).getByRole('button', { name: /activate/i });

    await userEvent.click(activateButton);

    expect(updateMutation.mutate).toHaveBeenCalledWith({ id: 'user-inactive', isActive: true });
    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(addNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'User status updated',
        message: expect.stringContaining('Inactive User is now active'),
      })
    );
  });
});

