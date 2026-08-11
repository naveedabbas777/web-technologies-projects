import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PostsService, Post } from '../../../services/posts.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OneClickNavDirective],
  templateUrl: './admin-posts.component.html',
  styleUrl: './admin-posts.component.css'
})
export class AdminPostsComponent implements OnInit {
  posts: Post[] = [];
  searchQuery = '';
  searchSubject = new Subject<string>();
  loading = false;

  constructor(private postsService: PostsService) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.loadPosts();
    });
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.postsService.getAllPosts(this.searchQuery).subscribe({
      next: (data: any) => {
        this.posts = data.posts || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading posts:', err);
        this.loading = false;
      }
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  deletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postsService.deletePost(postId).subscribe({
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

