import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Post {
  _id: string;
  title: string;
  caption: string;
  image?: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  likes: string[];
  dislikes: string[];
  commentCount?: number;
  createdAt: string;
}

export interface PostFeedResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPosts(page: number = 1, limit: number = 10, search?: string): Observable<PostFeedResponse> {
    let params = new HttpParams();
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PostFeedResponse>(`${this.apiUrl}/posts`, { params });
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  getPostsByUser(userId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/users/${userId}/posts`);
  }

  createPost(title: string, caption: string, image: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('caption', caption);
    formData.append('image', image);

    return this.http.post(`${this.apiUrl}/posts`, formData);
  }

  updatePost(id: string, title: string, caption: string, image?: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('caption', caption);
    if (image) {
      formData.append('image', image);
    }

    return this.http.put(`${this.apiUrl}/posts/${id}`, formData);
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  likePost(id: string): Observable<{ likes: string[]; dislikes: string[] }> {
    return this.http.post<{ likes: string[]; dislikes: string[] }>(
      `${this.apiUrl}/posts/${id}/like`,
      {}
    );
  }

  dislikePost(id: string): Observable<{ likes: string[]; dislikes: string[] }> {
    return this.http.post<{ likes: string[]; dislikes: string[] }>(
      `${this.apiUrl}/posts/${id}/dislike`,
      {}
    );
  }

  // Admin methods
  getAllPosts(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.apiUrl}/admin/posts`, {
      params
    });
  }

  adminDeletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/posts/${postId}`);
  }
}
