import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errors: string[] = [];
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errors = [];
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errors.push('Email and password are required');
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        if (err.error && err.error.errors) {
          this.errors = err.error.errors.map((e: any) => e.msg);
        } else {
          this.errorMessage = err.error?.msg || 'Invalid credentials';
        }
      }
    });
  }
}

