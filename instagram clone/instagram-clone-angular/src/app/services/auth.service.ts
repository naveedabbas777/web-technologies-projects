import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  profilePicture?: string;
  bio?: string;
  followers?: User[];
  following?: User[];
  followersCount?: number;
  followingCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated = signal<boolean>(false);
  public userRole = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Error decoding token', e);
      return null;
    }
  }

  fetchUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }


  checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.user && decoded.user.id) {
        this.isAuthenticated.set(true);
        this.userRole.set(decoded.user.role);
        this.fetchUserProfile(decoded.user.id).subscribe({
          next: (user) => {
            this.currentUserSubject.next(user);
            if (user.role) {
              this.userRole.set(user.role);
            }
            console.debug('AuthService: fetched profile during auth check', { id: user._id, role: user.role });
          },
          error: (err) => {
            console.error('Error fetching user profile during auth check:', err);
            this.logout(); // Logout if profile fetching fails
          }
        });
      } else {
        this.logout(); // Invalid token, log out
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        console.log('AuthService.login response:', res);
        localStorage.setItem('token', res.token);
        const decoded = this.decodeToken(res.token);
        if (decoded && decoded.user && decoded.user.id) {
          this.isAuthenticated.set(true);
          this.userRole.set(decoded.user.role);
          this.fetchUserProfile(decoded.user.id).subscribe({
            next: (user) => {
              this.currentUserSubject.next(user);
              if (user.role) {
                this.userRole.set(user.role);
              }
              console.debug('AuthService: fetched profile after login', { id: user._id, role: user.role });
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Error fetching user profile after login:', err);
              this.logout(); // Logout if profile fetching fails
            }
          });
        } else {
          console.error('Invalid token received after login');
          this.logout(); // Logout if token is invalid
        }
      })
    );
  }

  signup(username: string, email: string, password: string, password2: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/signup`, { username, email, password, password2 }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        const decoded = this.decodeToken(res.token);
        if (decoded && decoded.user && decoded.user.id) {
          this.isAuthenticated.set(true);
          this.userRole.set(decoded.user.role);
          this.fetchUserProfile(decoded.user.id).subscribe({
            next: (user) => {
              this.currentUserSubject.next(user);
              if (user.role) {
                this.userRole.set(user.role);
              }
              console.debug('AuthService: fetched profile after signup', { id: user._id, role: user.role });
              this.router.navigate(['/']);
            },
            error: (err) => {
              console.error('Error fetching user profile after signup:', err);
              this.logout(); // Logout if profile fetching fails
            }
          });
        } else {
          console.error('Invalid token received after signup');
          this.logout(); // Logout if token is invalid
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.userRole.set(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
    if (user.role) {
      this.userRole.set(user.role);
    }
  }

  isAdmin(): boolean {
    return this.userRole() === 'admin';
  }
}

