import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-user-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile-edit.component.html',
  styleUrls: ['./user-profile-edit.component.css']
})
export class UserProfileEditComponent implements OnInit {
  bio = '';
  profilePicture: File | null = null;
  profilePicturePreview: string | null = null;
  errorMessage: string | null = null; // Added for error messages

  constructor(
    private usersService: UsersService,
    private authService: AuthService, // Inject AuthService
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUserId = this.authService.currentUserSubject.value?._id;
    if (currentUserId) {
      this.usersService.getProfile(currentUserId).subscribe({
        next: (data) => {
          this.bio = data.bio || '';
          if (data.profilePicture) {
            this.profilePicturePreview = 'http://localhost:8001' + data.profilePicture;
          }
        },
        error: (err) => {
          console.error('Error fetching profile:', err);
          this.errorMessage = 'Failed to load profile data.';
        }
      });
    } else {
      this.errorMessage = 'User not logged in.';
      // Optionally redirect to login or home
      this.router.navigate(['/auth/login']);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.profilePicture = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profilePicturePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.profilePicture);
    }
  }

  onSubmit(): void {
    this.errorMessage = null; // Clear previous errors
    this.usersService.updateProfile(this.bio, this.profilePicture || undefined).subscribe({
      next: (updatedUser) => {
        this.authService.setCurrentUser(updatedUser); // Update AuthService with new data
        alert('Profile updated successfully!'); // Provide success feedback
        this.router.navigate(['/users/profile']);
      },
      error: (err: any) => {
        console.error('Error updating profile:', err);
        this.errorMessage = 'Failed to update profile.';
      }
    });
  }
}

