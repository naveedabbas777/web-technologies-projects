import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/users.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';

@Component({
  selector: 'app-admin-user-posts',
  standalone: true,
  imports: [CommonModule, RouterModule, OneClickNavDirective],
  templateUrl: './admin-user-posts.component.html',
  styleUrl: './admin-user-posts.component.css'
})
export class AdminUserPostsComponent implements OnInit {
  posts: any[] = [];
  username = '';
  userId = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
    this.loadPosts();
  }

  loadPosts(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.usersService.getUserPostsForAdmin(this.userId).subscribe({
      next: (data: any) => {
        this.posts = data.posts || [];
        this.username = data.username || 'User';
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading user posts:', err);
        this.loading = false;
      }
    });
  }

  deletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.usersService.adminDeleteUserPost(this.userId, postId).subscribe({
        next: () => {
          this.loadPosts();
        },
        error: (err: any) => {
          console.error('Error deleting post:', err);
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
}

