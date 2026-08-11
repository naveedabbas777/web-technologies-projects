import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CommentsService, Comment } from '../../../services/comments.service';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-comments.component.html',
  styleUrl: './admin-comments.component.css'
})
export class AdminCommentsComponent implements OnInit {
  comments: any[] = [];
  loading = false;

  constructor(private commentsService: CommentsService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.loading = true;
    this.commentsService.getAllComments().subscribe({
      next: (data: any) => {
        this.comments = data.comments || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading comments:', err);
        this.loading = false;
      }
    });
  }

  deleteComment(commentId: string): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentsService.adminDeleteComment(commentId).subscribe({
        next: () => {
          this.loadComments();
        },
        error: (err: any) => {
          console.error('Error deleting comment:', err);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPostLink(comment: any): string[] {
    if (comment.imagePost) {
      const postId = typeof comment.imagePost === 'string' ? comment.imagePost : comment.imagePost._id;
      return ['/posts', postId];
    } else if (comment.videoPost) {
      const postId = typeof comment.videoPost === 'string' ? comment.videoPost : comment.videoPost._id;
      return ['/videos', postId];
    }
    return ['/'];
  }

  getPostTitle(comment: any): string {
    if (comment.imagePost) {
      return typeof comment.imagePost === 'string' ? 'Unknown Post' : (comment.imagePost.title || 'Unknown Post');
    } else if (comment.videoPost) {
      return typeof comment.videoPost === 'string' ? 'Unknown Post' : (comment.videoPost.title || 'Unknown Post');
    }
    return 'Unknown Post';
  }
}

