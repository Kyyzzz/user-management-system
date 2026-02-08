import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserTable from './UserTable';
import { UserRole } from '../types/index.ts';

describe('UserTable', () => {
  const mockUsers = [
    {
      id: 1,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  it('renders user table with all user information', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for admin users', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit /i });
    const deleteButtons = screen.getAllByRole('button', { name: /^delete /i });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('hides action buttons for regular users', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.USER}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole('button', { name: /^edit /i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete /i })).not.toBeInTheDocument();
  });

  it('calls onEdit callback when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit Admin User' }));

    expect(onEdit).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('shows confirmation dialog and deletes user when confirmed', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete Admin User' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(mockUsers[0].id);
    confirmSpy.mockRestore();
  });

  it('does not delete user when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <UserTable
        users={mockUsers}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Delete Admin User' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('displays empty state message when no users exist', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <UserTable
        users={[]}
        currentUserRole={UserRole.ADMIN}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });
});
