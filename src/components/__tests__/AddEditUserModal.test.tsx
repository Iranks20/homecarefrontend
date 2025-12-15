import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import AddEditUserModal from '../AddEditUserModal';
import { vi } from 'vitest';

const renderModal = (props?: Partial<ComponentProps<typeof AddEditUserModal>>) => {
  const defaultProps: ComponentProps<typeof AddEditUserModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    isSaving: false,
  };

  return {
    ...render(<AddEditUserModal {...defaultProps} {...props} />),
    props: { ...defaultProps, ...props },
  };
};

describe('AddEditUserModal', () => {
  it('does not render when closed', () => {
    render(<AddEditUserModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} isSaving={false} />);
    expect(screen.queryByText(/Add New User/i)).not.toBeInTheDocument();
  });

  it('validates password length before saving', async () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Theresa Charles');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'theresa@example.com');
    await userEvent.type(screen.getByLabelText(/Temporary Password/i), 'short');

    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('submits the form and closes modal on success', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    renderModal({ onSave, onClose });

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Samuel Carter');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'samuel@example.com');
    await userEvent.type(screen.getByLabelText(/Department/i), 'Operations');
    await userEvent.type(screen.getByLabelText(/Phone Number/i), '+1-222-3333');
    await userEvent.type(screen.getByLabelText(/Temporary Password/i), 'Complex#123');

    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Samuel Carter',
        email: 'samuel@example.com',
        password: 'Complex#123',
        role: 'nurse',
        phone: '+1-222-3333',
        department: 'Operations',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});

