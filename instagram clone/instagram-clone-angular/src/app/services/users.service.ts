import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { User } from './auth.service';
import { AuthService } from './auth.service';
import { Post } from './posts.service'; // Import Post interface
import { VideoPost } from './videos.service'; // Import VideoPost interface
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  updateProfile(bio: string, profilePicture?: File): Observable<any> {
    const formData = new FormData();
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    return this.http.put(`${this.apiUrl}/users/profile`, formData);
  }

  getUserPosts(userId: string, search?: string): Observable<Post[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Post[]>(`${this.apiUrl}/users/${userId}/posts`, {
      params
    });
  }

  getUserVideos(userId: string, search?: string): Observable<VideoPost[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<VideoPost[]>(`${this.apiUrl}/users/${userId}/videos`, {
      params
    });
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/follow`, {});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/unfollow`, {});
  }

  getFollowers(userId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/${userId}/followers`);
  }

  getFollowing(userId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/${userId}/following`);
  }

  // Admin methods
  getUsers(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.apiUrl}/admin/users`, {
      params
    });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, { role });
  }

  adminDeleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${userId}`);
  }

  adminDeletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/posts/${postId}`);
  }

  adminDeleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/comments/${commentId}`);
  }

  // Return current user's posts (if logged in)
  getMyPosts(): Observable<any> {
    const current = this.authService.getCurrentUser();
    if (current && current._id) {
      return this.getUserPosts(current._id);
    }
    return of({ posts: [] });
  }

  // For admin UI: fetch a user's posts together with username
  getUserPostsForAdmin(userId: string): Observable<any> {
    return forkJoin({
      user: this.getProfile(userId),
      posts: this.getUserPosts(userId)
    }).pipe(map(({ user, posts }) => ({ username: (user as any).username, posts })));
  }

  // For admin UI: fetch a user's comments by filtering admin comments
  getUserCommentsForAdmin(userId: string): Observable<any> {
    return forkJoin({
      user: this.getProfile(userId),
      comments: this.http.get<any[]>(`${this.apiUrl}/admin/comments`)
    }).pipe(map(({ user, comments }) => {
      const filtered = (comments || []).filter(c => {
        const authorId = (c.author && (c.author._id || c.author)) || c.author;
        return authorId === userId || (authorId && authorId.toString && authorId.toString() === userId);
      });
      return { username: (user as any).username, comments: filtered };
    }));
  }

  adminDeleteUserComment(userId: string, commentId: string): Observable<any> {
    return this.adminDeleteComment(commentId);
  }

  adminDeleteUserPost(userId: string, postId: string): Observable<any> {
    return this.adminDeletePost(postId);
  }
}


