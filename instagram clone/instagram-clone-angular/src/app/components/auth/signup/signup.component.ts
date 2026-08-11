import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  password2 = ''; // Added for password confirmation
  errors: string[] = [];
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errors = [];
    this.errorMessage = '';

    if (!this.username || !this.email || !this.password || !this.password2) {
      this.errors.push('All fields are required');
      return;
    }

    if (this.password !== this.password2) {
      this.errors.push('Passwords do not match');
      return;
    }

    this.authService.signup(this.username, this.email, this.password, this.password2).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        if (err.error && err.error.errors) {
          this.errors = err.error.errors.map((e: any) => e.msg);
        } else {
          this.errorMessage = err.error?.msg || 'Error creating account';
        }
      }
    });
  }
}

