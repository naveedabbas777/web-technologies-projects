import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, startWith, forkJoin, catchError, of, tap } from 'rxjs';
import { VideosService, VideoPost } from '../../../services/videos.service';
import { CommentsService } from '../../../services/comments.service';
import { AuthService } from '../../../services/auth.service';

// Video-only content type
export interface FeedItem {
  id: string;
  type: 'video';
  data: VideoPost;
  createdAt: string;
}

@Component({
  selector: 'app-video-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './video-feed.component.html',
  styleUrls: ['./video-feed.component.css']
})

export class VideoFeedComponent implements OnInit, OnDestroy {
  feedItems: FeedItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  loading = false;
  errorMessage: string | null = null;
  searchQuery = '';
  searchSubject = new Subject<string>();

  // Comment expansion state
  expandedComments: Set<string> = new Set();
  itemComments: { [itemId: string]: any[] } = {};
  loadingComments: Set<string> = new Set();
  newComments: { [itemId: string]: string } = {};

  private destroy$: Subject<void> = new Subject<void>();
  private loadTrigger = new Subject<boolean>();

  constructor(
    private videosService: VideosService,
    private commentsService: CommentsService,
    public authService: AuthService
  ) {
    console.log('🎬 VideoFeedComponent constructor called');
  }

  ngOnInit(): void {
    console.log('🚀 VideoFeed component initialized');
    console.log('🔗 API URL:', this.videosService['apiUrl']);
    // Trigger initial load
    this.loadTrigger.next(true);

    combineLatest([
      this.authService.currentUser$.pipe(startWith(null)),
      this.searchSubject.pipe(startWith(''), debounceTime(500), distinctUntilChanged()),
      this.loadTrigger
    ])
    .pipe(
      takeUntil(this.destroy$),
      filter(([user, searchQueryParam, reset]) => {
        console.log('Auth check - User exists:', !!user, '- Loading public video content');
        // Allow loading content even if not authenticated (videos are public)
        return !this.loading && (reset || this.currentPage < this.totalPages);
      }),
      switchMap(([user, searchQueryParam, reset]) => {
        this.loading = true;
        this.errorMessage = null;
        if (reset) {
          this.currentPage = 1;
          this.feedItems = [];
        } else {
          this.currentPage++;
        }
        const videosLimit = this.itemsPerPage; // Load full page of videos only

        console.log(`📡 Making API request - Videos: ${videosLimit}`);
        console.log(`🔗 Videos URL: ${this.videosService['apiUrl']}/videos`);

        // Load only videos with error handling
        console.log('🔄 About to create videosRequest...');
        const videosRequest = this.videosService.getVideos(this.currentPage, videosLimit, searchQueryParam || undefined).pipe(
          tap((data: any) => console.log('✅ Videos API response:', data)),
          catchError(error => {
            console.error('❌ Error loading videos:', error);
            console.error('Videos error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              url: error.url,
              fullError: error
            });
            return of({ videoPosts: [], currentPage: this.currentPage, totalPages: 0, totalCount: 0 });
          })
        );

        console.log('🚀 Making API request...');

        return videosRequest;
      })
    )
    .subscribe({
      next: (data: any) => {
        console.log('🎉 Subscription next() called!');
        console.log('📦 Raw data received:', data);
        console.log('Feed loaded:', data.videoPosts?.length || 0, 'videos');

        // Process only videos
        const videos: FeedItem[] = (data.videoPosts || []).map((video: any) => ({
          id: video._id,
          type: 'video' as const,
          data: video,
          createdAt: video.createdAt
        }));

        console.log(`Processed ${videos.length} video items`);

        this.feedItems = [...this.feedItems, ...videos];
        // Use total pages from videos response
        this.totalPages = data.totalPages || 1;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('💥 Feed loading failed:', err);
        console.error('Error details:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          fullError: err
        });
        this.errorMessage = 'Failed to load videos. Please try again.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
    this.loadTrigger.complete();
  }

  likeItem(item: FeedItem): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'You must be logged in to like videos.';
      return;
    }

    this.videosService.likeVideo(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result: { likes: string[]; dislikes: string[] }) => {
        // Update the item in the feed
        const feedItem = this.feedItems.find(fi => fi.id === item.id);
        if (feedItem) {
          feedItem.data.likes = result.likes;
          feedItem.data.dislikes = result.dislikes;
        }
      },
      error: (err: any) => {
        console.error('Error liking video:', err);
        this.errorMessage = 'Failed to like video. Please try again.';
      }
    });
  }

  dislikeItem(item: FeedItem): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'You must be logged in to dislike videos.';
      return;
    }

    this.videosService.dislikeVideo(item.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result: { likes: string[]; dislikes: string[] }) => {
        // Update the item in the feed
        const feedItem = this.feedItems.find(fi => fi.id === item.id);
        if (feedItem) {
          feedItem.data.likes = result.likes;
          feedItem.data.dislikes = result.dislikes;
        }
      },
      error: (err: any) => {
        console.error('Error disliking video:', err);
        this.errorMessage = 'Failed to dislike video. Please try again.';
      }
    });
  }

  hasLiked(item: FeedItem): boolean {
    return this.authService.isAuthenticated() && this.authService.currentUserSubject.value
      ? item.data.likes.includes(this.authService.currentUserSubject.value._id)
      : false;
  }

  hasDisliked(item: FeedItem): boolean {
    return this.authService.isAuthenticated() && this.authService.currentUserSubject.value
      ? item.data.dislikes.includes(this.authService.currentUserSubject.value._id)
      : false;
  }

  getContentText(item: FeedItem): string {
    return (item.data as VideoPost).description || '';
  }

  getVideoPath(item: FeedItem): string {
    return (item.data as VideoPost).videoPath || '';
  }

  getFeedStats(): string {
    const videoCount = this.feedItems?.length || 0;
    return `${videoCount} videos loaded`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Comment functionality
  toggleComments(itemId: string): void {
    if (this.expandedComments.has(itemId)) {
      this.expandedComments.delete(itemId);
    } else {
      this.expandedComments.add(itemId);
      if (!this.itemComments[itemId]) {
        this.loadComments(itemId);
      }
    }
  }

  loadComments(itemId: string): void {
    this.loadingComments.add(itemId);

    this.commentsService.getCommentsForVideo(itemId).subscribe({
      next: (comments) => {
        this.itemComments[itemId] = comments;
        this.loadingComments.delete(itemId);
      },
      error: (err: any) => {
        console.error('Error loading comments:', err);
        this.loadingComments.delete(itemId);
      }
    });
  }

  addComment(itemId: string): void {
    const commentText = this.newComments[itemId]?.trim();
    if (!commentText) return;

    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'You must be logged in to add comments.';
      return;
    }

    this.commentsService.createCommentForVideo(itemId, commentText).subscribe({
      next: (comment) => {
        if (!this.itemComments[itemId]) {
          this.itemComments[itemId] = [];
        }
        this.itemComments[itemId].push(comment);
        this.newComments[itemId] = '';

        // Update comment count in the feed item
        const feedItem = this.feedItems.find(item => item.id === itemId);
        if (feedItem) {
          (feedItem.data as VideoPost).commentCount = ((feedItem.data as VideoPost).commentCount || 0) + 1;
        }
      },
      error: (err: any) => {
        console.error('Error adding comment:', err);
        this.errorMessage = 'Failed to add comment. Please try again.';
      }
    });
  }

  deleteComment(itemId: string, commentId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'You must be logged in to delete comments.';
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        // Remove comment from local array
        if (this.itemComments[itemId]) {
          this.itemComments[itemId] = this.itemComments[itemId].filter(c => c._id !== commentId);
        }

        // Update comment count in the feed item
        const feedItem = this.feedItems.find(item => item.id === itemId);
        if (feedItem) {
          const video = feedItem.data as VideoPost;
          if (video.commentCount && video.commentCount > 0) {
            video.commentCount--;
          }
        }
      },
      error: (err: any) => {
        console.error('Error deleting comment:', err);
        this.errorMessage = 'Error deleting comment.';
      }
    });
  }

  isCommentsExpanded(itemId: string): boolean {
    return this.expandedComments.has(itemId);
  }

  isLoadingComments(itemId: string): boolean {
    return this.loadingComments.has(itemId);
  }

  loadMore(): void {
    if (!this.loading && this.currentPage < this.totalPages) {
      this.loadTrigger.next(false);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchSubject.next(this.searchQuery);
    // Reset pagination when searching
    this.loadTrigger.next(true);
  }

}
