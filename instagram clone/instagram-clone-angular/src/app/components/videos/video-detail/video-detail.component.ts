import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; // Import Router
import { FormsModule } from '@angular/forms';
import { VideosService, VideoPost } from '../../../services/videos.service';
import { CommentsService, Comment } from '../../../services/comments.service'; // Import Comment interface
import { AuthService } from '../../../services/auth.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';
import { Subject, combineLatest, forkJoin, of, switchMap, takeUntil } from 'rxjs'; // Import necessary RxJS operators

@Component({
  selector: 'app-video-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OneClickNavDirective],
  templateUrl: './video-detail.component.html',
  styleUrls: ['./video-detail.component.css']
})
export class VideoDetailComponent implements OnInit, OnDestroy {
  videoPost: VideoPost | null = null;
  comments: Comment[] = []; // Typed as Comment[]
  newComment = '';
  loadingVideo = false; // Loading indicator for video
  loadingComments = false; // Loading indicator for comments
  loadingCommentAdd = false; // Loading indicator for adding a comment
  videoErrorMessage: string | null = null;
  commentErrorMessage: string | null = null;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Inject Router
    private videosService: VideosService,
    private commentsService: CommentsService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const videoId = params.get('id');
        if (!videoId) {
          this.videoErrorMessage = 'Video ID not found.';
          return of({ video: null, comments: [] }); // Return empty observables
        }
        this.loadingVideo = true;
        this.loadingComments = true;
        this.videoErrorMessage = null;
        this.commentErrorMessage = null;

        return forkJoin({
          video: this.videosService.getVideo(videoId),
          comments: this.commentsService.getCommentsForVideo(videoId)
        }).pipe(takeUntil(this.destroy$));
      })
    ).subscribe({
      next: (data) => {
        this.videoPost = data.video;
        this.comments = data.comments;
        this.loadingVideo = false;
        this.loadingComments = false;
      },
      error: (err: any) => {
        console.error('Error loading video details:', err);
        this.videoErrorMessage = 'Failed to load video. Please try again later.';
        this.loadingVideo = false;
        this.loadingComments = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addComment(): void {
    if (!this.videoPost || !this.newComment.trim()) {
      this.commentErrorMessage = 'Comment cannot be empty.';
      return;
    }

    this.loadingCommentAdd = true;
    this.commentErrorMessage = null; // Clear previous errors
    this.commentsService.createCommentForVideo(this.videoPost._id, this.newComment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comment) => {
          this.newComment = '';
          this.loadingCommentAdd = false;
          // Efficiently update comments by adding the new comment directly
          this.comments.push(comment);
        },
        error: (err: any) => {
          this.loadingCommentAdd = false;
          console.error('Error adding comment:', err);
          this.commentErrorMessage = 'Failed to add comment. Please try again.';
        }
      });
  }

  // Helper function to load comments for a video
  loadComments(videoId: string): void {
    this.loadingComments = true;
    this.commentErrorMessage = null;
    this.commentsService.getCommentsForVideo(videoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.loadingComments = false;
        },
        error: (err: any) => {
          console.error('Error loading comments:', err);
          this.commentErrorMessage = 'Failed to load comments.';
          this.loadingComments = false;
        }
      });
  }

  likeVideo(videoPost: VideoPost): void {
    if (!this.authService.isAuthenticated()) {
      this.videoErrorMessage = 'You must be logged in to like videos.';
      return;
    }
    this.videosService.likeVideo(videoPost._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (this.videoPost && this.videoPost._id === videoPost._id) {
          this.videoPost.likes = result.likes;
          this.videoPost.dislikes = result.dislikes;
        }
      },
      error: (err: any) => {
        console.error('Error liking video:', err);
        this.videoErrorMessage = 'Failed to like video. Please try again.';
      }
    });
  }

  dislikeVideo(videoPost: VideoPost): void {
    if (!this.authService.isAuthenticated()) {
      this.videoErrorMessage = 'You must be logged in to dislike videos.';
      return;
    }
    this.videosService.dislikeVideo(videoPost._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (this.videoPost && this.videoPost._id === videoPost._id) {
          this.videoPost.likes = result.likes;
          this.videoPost.dislikes = result.dislikes;
        }
      },
      error: (err: any) => {
        console.error('Error disliking video:', err);
        this.videoErrorMessage = 'Failed to dislike video. Please try again.';
      }
    });
  }

  hasLiked(videoPost: VideoPost): boolean {
    return this.authService.isAuthenticated() && this.authService.currentUserSubject.value
      ? videoPost.likes.includes(this.authService.currentUserSubject.value._id)
      : false;
  }

  hasDisliked(videoPost: VideoPost): boolean {
    return this.authService.isAuthenticated() && this.authService.currentUserSubject.value
      ? videoPost.dislikes.includes(this.authService.currentUserSubject.value._id)
      : false;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

