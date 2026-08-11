import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  imagePost?: string;
  videoPost?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCommentForPost(postId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/posts/${postId}/comments`, { content });
  }

  getCommentsForPost(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  createCommentForVideo(videoId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/videos/${videoId}/comments`, { content });
  }

  getCommentsForVideo(videoId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/videos/${videoId}/comments`);
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`);
  }

  // Admin methods
  getAllComments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/comments`);
  }

  adminDeleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/comments/${commentId}`);
  }
}

