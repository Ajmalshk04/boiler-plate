import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { CustomBadge } from '../custom/CustomBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { User } from '../../lib/api';
import { useUpdateUserStatus, useDeleteUser } from '../../hooks/useUsers';
import { format } from 'date-fns';

interface UsersTableProps {
  users: User[];
  onViewUser?: (user: User) => void;
  onEditUser?: (user: User) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onViewUser,
  onEditUser,
}) => {
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: deleteUser } = useDeleteUser();

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <CustomBadge variant="secondary">Inactive</CustomBadge>;
    }

    switch (status) {
      case 'active':
        return <CustomBadge variant="default">Active</CustomBadge>;
      case 'locked':
        return <CustomBadge variant="destructive">Locked</CustomBadge>;
      case 'suspended':
        return <CustomBadge variant="destructive">Suspended</CustomBadge>;
      default:
        return <CustomBadge variant="secondary">{status}</CustomBadge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <CustomBadge variant="destructive">Admin</CustomBadge>
    ) : (
      <CustomBadge variant="outline">User</CustomBadge>
    );
  };

  const handleStatusToggle = (user: User) => {
    updateStatus({
      id: user._id,
      data: { isActive: !user.isActive },
    });
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUser(user._id);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Account Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.companyName && (
                      <div className="text-sm text-muted-foreground">
                        {user.companyName}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">{user.email}</div>
                  <div className="text-sm text-muted-foreground">{user.mobile}</div>
                </div>
              </TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                <CustomBadge variant="outline">{user.accountType}</CustomBadge>
              </TableCell>
              <TableCell>{getStatusBadge(user.status, user.isActive)}</TableCell>
              <TableCell>
                {user.lastLogin ? (
                  <div className="text-sm">
                    {format(new Date(user.lastLogin), 'MMM dd, yyyy')}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewUser?.(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditUser?.(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusToggle(user)}>
                      {user.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(user)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};