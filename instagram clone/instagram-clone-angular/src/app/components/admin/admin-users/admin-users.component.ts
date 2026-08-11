import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  searchQuery = '';
  loading = false;
  errorMessage = '';

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    console.log('Loading users with search:', this.searchQuery);

    this.usersService.getUsers(this.searchQuery).subscribe({
      next: (data: any) => {
        // Backend returns users array directly, not wrapped in {users: [...]}
        this.users = Array.isArray(data) ? data : (data.users || []);
        console.log('Loaded users:', this.users.length, 'users:', this.users);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading users:', err);
        this.errorMessage = 'Failed to load users. Please check your permissions.';
        this.users = [];
        this.loading = false;
      }
    });
  }

  updateRole(userId: string, role: string): void {
    this.usersService.updateUserRole(userId, role).subscribe({
      next: () => this.loadUsers()
    });
  }

  deleteUser(userId: string, username: string): void {
    if (confirm(`Are you sure you want to delete user "${username}"? This will also delete all their posts, videos, and comments. This action cannot be undone.`)) {
      this.usersService.adminDeleteUser(userId).subscribe({
        next: () => {
          alert(`User "${username}" has been deleted successfully.`);
          this.loadUsers();
        },
        error: (err: any) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

