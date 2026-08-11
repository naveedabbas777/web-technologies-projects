import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VideoPost {
  _id: string;
  title: string;
  description: string;
  videoPath?: string;
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

export interface VideoFeedResponse {
  videoPosts: VideoPost[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVideos(page?: number, limit?: number, search?: string): Observable<VideoFeedResponse> {
    let params = new HttpParams();
    if (page != null) params = params.set('page', page.toString());
    if (limit != null) params = params.set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<VideoFeedResponse>(`${this.apiUrl}/videos`, { params });
  }

  getVideo(id: string): Observable<VideoPost> {
    return this.http.get<VideoPost>(`${this.apiUrl}/videos/${id}`);
  }

  createVideo(title: string, description: string, video: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', video);

    return this.http.post(`${this.apiUrl}/videos`, formData);
  }

  updateVideo(id: string, title: string, description: string, video?: File): Observable<any> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (video) {
      formData.append('video', video);
    }

    return this.http.put(`${this.apiUrl}/videos/${id}`, formData);
  }

  deleteVideo(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/videos/${id}`);
  }

  likeVideo(id: string): Observable<{ likes: string[]; dislikes: string[] }> {
    return this.http.post<{ likes: string[]; dislikes: string[] }>(
      `${this.apiUrl}/videos/${id}/like`,
      {}
    );
  }

  dislikeVideo(id: string): Observable<{ likes: string[]; dislikes: string[] }> {
    return this.http.post<{ likes: string[]; dislikes: string[] }>(
      `${this.apiUrl}/videos/${id}/dislike`,
      {}
    );
  }
}

