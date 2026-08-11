import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostsService, Post } from '../../../services/posts.service';
import { CommentsService, Comment } from '../../../services/comments.service';
import { AuthService, User } from '../../../services/auth.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';

interface TapTimesMap { [key: string]: number; }

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OneClickNavDirective],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  newComment = '';
  loading = true;
  loadingComments = false;
  loadingCommentAdd = false;
  errorMessage = '';
  commentErrorMessage = '';
  currentUser: User | null = null;

  private lastTapTimes: TapTimesMap = {};
  private tapThreshold = 400; // ms
  private pendingLikeRequests: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private postsService: PostsService,
    private commentsService: CommentsService,
    public authService: AuthService,
    private router: Router
  ) {}



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

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadPost(id);
      }
    });
  }

  loadPost(id: string): void {
    this.loading = true;
    this.postsService.getPost(id).subscribe({
      next: (post) => {
        this.post = post;
        this.loadComments(id);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading post:', err);
        this.loading = false;
        this.errorMessage = 'Error loading post.';
      }
    });
  }

  loadComments(postId: string): void {
    this.loadingComments = true;
    this.commentErrorMessage = '';
    this.commentsService.getCommentsForPost(postId).subscribe({
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

  addComment(): void {
    if (!this.post || !this.newComment.trim()) {
      this.commentErrorMessage = 'Comment cannot be empty.';
      return;
    }
    if (!this.currentUser) {
      this.commentErrorMessage = 'You must be logged in to add comments.';
      return;
    }

    this.loadingCommentAdd = true;
    this.commentErrorMessage = ''; // Clear previous errors

    this.commentsService.createCommentForPost(this.post._id, this.newComment).subscribe({
      next: (comment) => {
        this.newComment = '';
        this.loadingCommentAdd = false;
        // Efficiently update comments by adding the new comment directly
        this.comments.push(comment);
        if (this.post) {
          this.post.commentCount = (this.post.commentCount || 0) + 1; // Increment comment count
        }
      },
      error: (err: any) => {
        console.error('Error adding comment:', err);
        this.loadingCommentAdd = false;
        this.commentErrorMessage = 'Failed to add comment. Please try again.';
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to delete comments.';
      return;
    }
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.commentsService.deleteComment(commentId).subscribe({
      next: () => {
        // Efficiently remove the comment from the local array
        this.comments = this.comments.filter(comment => comment._id !== commentId);
        if (this.post && this.post.commentCount && this.post.commentCount > 0) {
          this.post.commentCount--; // Decrement comment count
        }
      },
      error: (err: any) => {
        console.error('Error deleting comment:', err);
        this.errorMessage = 'Error deleting comment.';
      }
    });
  }

  likePost(postId: string): void {
    if (!this.currentUser) {
      this.errorMessage = 'You must be logged in to like posts.';
      return;
    }
    if (this.pendingLikeRequests.has(postId)) return;
    this.pendingLikeRequests.add(postId);

    this.postsService.likePost(postId).subscribe({
      next: (res) => {
        if (this.post) {
          this.post.likes = (res as any).likes as any;
          this.post.dislikes = (res as any).dislikes as any;
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

    this.postsService.dislikePost(postId).subscribe({
      next: (res) => {
        if (this.post) {
          this.post.likes = (res as any).likes as any;
          this.post.dislikes = (res as any).dislikes as any;
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

  hasLiked(post: Post): boolean {
    return this.currentUser ? post.likes.includes(this.currentUser._id) : false;
  }

  hasDisliked(post: Post): boolean {
    return this.currentUser ? post.dislikes.includes(this.currentUser._id) : false;
  }

  isAuthor(authorId: string): boolean {
    return this.currentUser ? this.currentUser._id === authorId : false;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

