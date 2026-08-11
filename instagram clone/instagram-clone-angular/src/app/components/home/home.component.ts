import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, filter } from 'rxjs';
import { PostsService, Post, PostFeedResponse } from '../../services/posts.service';
import { AuthService, User } from '../../services/auth.service';
import { CommentsService } from '../../services/comments.service';
import { OneClickNavDirective } from '../../directives/one-click-nav.directive';

interface TapTimesMap { [key: string]: number; }

interface LikeDislikeResponse {
  likes: string[];
  dislikes: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OneClickNavDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  loadingPosts = false;
  errorMessage = '';
  currentUser: User | null = null;
  searchQuery = '';
  successMessage: string | null = null;

  currentPage = 0;
  itemsPerPage = 10;
  totalPages = 1;

  private searchSubject: Subject<string> = new Subject<string>();
  private loadTrigger: Subject<void> = new Subject<void>();
  private destroy$: Subject<void> = new Subject<void>();

  private lastTapTimes: TapTimesMap = {};
  private tapThreshold = 400; // ms
  private pendingLikeRequests: Set<string> = new Set();

  // Comment expansion state
  expandedComments: Set<string> = new Set();
  postComments: { [postId: string]: any[] } = {};
  loadingComments: Set<string> = new Set();
  newComments: { [postId: string]: string } = {};

  constructor(
    private postsService: PostsService,
    private commentsService: CommentsService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    combineLatest([
      this.authService.currentUser$.pipe(startWith(null as User | null)),
      this.searchSubject.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.loadTrigger.pipe(startWith(undefined))
    ])
    .pipe(
      takeUntil(this.destroy$),
      filter(([user]) => !!user), // Only proceed if user is authenticated
      switchMap(([user, query]) => {

        if (this.currentPage >= this.totalPages && this.totalPages > 0) {
          return [];
        }

        this.loadingPosts = true;
        this.errorMessage = '';

        const nextPage = this.currentPage + 1;
        return this.postsService.getPosts(nextPage, this.itemsPerPage, query);
      })
    )
    .subscribe({
      next: (response: PostFeedResponse) => {
        if (response && response.posts) {
          this.posts = [...this.posts, ...response.posts];
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.loadingPosts = false;
        } else {
          // Handle case where response or response.posts is undefined
          this.errorMessage = 'No posts found or invalid response.';
          this.loadingPosts = false;
        }
      },
      error: (err: any) => {
        console.error('Error loading posts:', err);
        this.errorMessage = 'Error loading posts.';
        this.loadingPosts = false;
      }
    });

    // Initial load
    this.loadTrigger.next();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isLoadingOrReachedEnd()) {
      return;
    }

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) { // 500px from bottom
      this.loadMorePosts();
    }
  }

  isLoadingOrReachedEnd(): boolean {
    return this.loadingPosts || this.currentPage >= this.totalPages;
  }

  loadMorePosts(): void {
    if (this.currentPage < this.totalPages) {
      this.loadTrigger.next();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isDuplicateTap(key: string): boolean {
    const now = Date.now();
    if (this.lastTapTimes[key] && now - this.lastTapTimes[key] < this.tapThreshold) return true;
    this.lastTapTimes[key] = now;
    return false;
  }

  tapLike(event: Event, postId: string): void {
    event.preventDefault();
    event.stopPropagation();
    const key = `like_${postId}`;
    if (this.isDuplicateTap(key)) return;
    this.likePost(postId);
  }

  tapDislike(event: Event, postId: string): void {
    event.preventDefault();
    event.stopPropagation();
    const key = `dislike_${postId}`;
    if (this.isDuplicateTap(key)) return;
    this.dislikePost(postId);
  }

  likePost(postId: string): void {
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to like posts.';
      return;
    }
    if (this.pendingLikeRequests.has(postId)) return;
    this.pendingLikeRequests.add(postId);

    this.postsService.likePost(postId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: LikeDislikeResponse) => {
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.likes = res.likes;
          post.dislikes = res.dislikes;
        }
        this.pendingLikeRequests.delete(postId);
      },
      error: (err: any) => {
        console.error('Error liking post:', err);
        this.errorMessage = 'Error liking post.';
        this.pendingLikeRequests.delete(postId);
      }
    });
  }

  dislikePost(postId: string): void {
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to dislike posts.';
      return;
    }
    if (this.pendingLikeRequests.has(postId)) return;
    this.pendingLikeRequests.add(postId);

    this.postsService.dislikePost(postId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: LikeDislikeResponse) => {
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.likes = res.likes;
          post.dislikes = res.dislikes;
        }
        this.pendingLikeRequests.delete(postId);
      },
      error: (err: any) => {
        console.error('Error disliking post:', err);
        this.errorMessage = 'Error disliking post.';
        this.pendingLikeRequests.delete(postId);
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.posts = []; // Clear current posts to load new search results
    this.currentPage = 0;
    this.totalPages = 1;
    this.loadTrigger.next(); // Trigger a new search from page 1
  }

  hasLiked(post: Post): boolean {
    return this.currentUser ? post.likes.includes(this.currentUser._id) : false;
  }

  hasDisliked(post: Post): boolean {
    return this.currentUser ? post.dislikes.includes(this.currentUser._id) : false;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Comment functionality
  toggleComments(postId: string): void {
    if (this.expandedComments.has(postId)) {
      this.expandedComments.delete(postId);
    } else {
      this.expandedComments.add(postId);
      if (!this.postComments[postId]) {
        this.loadComments(postId);
      }
    }
  }

  loadComments(postId: string): void {
    this.loadingComments.add(postId);
    this.commentsService.getCommentsForPost(postId).subscribe({
      next: (comments) => {
        this.postComments[postId] = comments;
        this.loadingComments.delete(postId);
      },
      error: (err: any) => {
        console.error('Error loading comments:', err);
        this.loadingComments.delete(postId);
      }
    });
  }

  addComment(postId: string): void {
    const commentText = this.newComments[postId]?.trim();
    if (!commentText) return;

    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to add comments.';
      return;
    }

    this.commentsService.createCommentForPost(postId, commentText).subscribe({
      next: (comment) => {
        if (!this.postComments[postId]) {
          this.postComments[postId] = [];
        }
        this.postComments[postId].push(comment);
        this.newComments[postId] = '';
        // Update comment count
        const post = this.posts.find(p => p._id === postId);
        if (post) {
          post.commentCount = (post.commentCount || 0) + 1;
        }
      },
      error: (err: any) => {
        console.error('Error adding comment:', err);
        this.errorMessage = 'Failed to add comment. Please try again.';
      }
    });
  }

  deleteComment(postId: string, commentId: string): void {
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to delete comments.';
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        // Remove comment from local array
        if (this.postComments[postId]) {
          this.postComments[postId] = this.postComments[postId].filter(c => c._id !== commentId);
        }
        // Update comment count
        const post = this.posts.find(p => p._id === postId);
        if (post && post.commentCount && post.commentCount > 0) {
          post.commentCount--;
        }
      },
      error: (err: any) => {
        console.error('Error deleting comment:', err);
        this.errorMessage = 'Error deleting comment.';
      }
    });
  }

  isCommentsExpanded(postId: string): boolean {
    return this.expandedComments.has(postId);
  }

  isLoadingComments(postId: string): boolean {
    return this.loadingComments.has(postId);
  }
}
