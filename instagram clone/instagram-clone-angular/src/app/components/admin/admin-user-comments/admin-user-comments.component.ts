import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-admin-user-comments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-user-comments.component.html',
  styleUrl: './admin-user-comments.component.css'
})
export class AdminUserCommentsComponent implements OnInit {
  comments: any[] = [];
  username = '';
  userId = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.loadComments();
  }

  loadComments(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.usersService.getUserCommentsForAdmin(this.userId).subscribe({
      next: (data: any) => {
        this.comments = data.comments || [];
        this.username = data.username || 'User';
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading user comments:', err);
        this.loading = false;
      }
    });
  }

  deleteComment(commentId: string): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.usersService.adminDeleteUserComment(this.userId, commentId).subscribe({
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
      return ['/posts', comment.imagePost._id || comment.imagePost];
    } else if (comment.videoPost) {
      return ['/videos', comment.videoPost._id || comment.videoPost];
    }
    return ['/'];
  }

  getPostTitle(comment: any): string {
    if (comment.imagePost) {
      return comment.imagePost.title || 'Unknown Post';
    } else if (comment.videoPost) {
      return comment.videoPost.title || 'Unknown Post';
    }
    return 'Unknown Post';
  }
}

