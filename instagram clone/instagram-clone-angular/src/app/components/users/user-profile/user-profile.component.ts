import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, combineLatest, debounceTime, distinctUntilChanged, forkJoin, of, switchMap, takeUntil, startWith, map, catchError } from 'rxjs';
import { UsersService } from '../../../services/users.service';
import { AuthService, User } from '../../../services/auth.service';
import { PostsService, Post } from '../../../services/posts.service';
import { VideosService, VideoPost } from '../../../services/videos.service';
import { CommentsService, Comment } from '../../../services/comments.service';
import { FollowersModalComponent } from '../followers-modal/followers-modal.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FollowersModalComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  profileUser: User | null = null;
  posts: Post[] = [];
  videoPosts: VideoPost[] = [];
  activeTab = 'posts';
  loadingProfile = false;
  loadingContent = false;
  searchQuery = '';
  searchSubject = new Subject<string>();

  isModalOpen = false;
  modalTitle = '';
  modalUsers: User[] = [];
  errorMessage: string | null = null;
  successMessage: string | null = null;
  followLoading = false;

  private destroy$: Subject<void> = new Subject<void>();
  private profileReloadTrigger = new Subject<void>(); // New trigger for profile reload

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private postsService: PostsService,
    private videosService: VideosService,
    private commentsService: CommentsService,
    public authService: AuthService
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery = query;
      this.loadFilteredContent();
    });
  }

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap.pipe(takeUntil(this.destroy$)),
      this.authService.currentUser$.pipe(takeUntil(this.destroy$), startWith(null as User | null)),
      this.profileReloadTrigger.pipe(startWith(undefined)) // Trigger initial load and reloads
    ])
    .pipe(
      switchMap(([params, currentUser, reloadTrigger]): Observable<[User | null, Post[], VideoPost[]]> => {
        this.loadingProfile = true;
        this.errorMessage = null;
        const userId = params.get('userId');

        if (userId) {
          return forkJoin([
            this.usersService.getProfile(userId).pipe(catchError(() => of(null as User | null))), // Handle profile fetch errors
            this.usersService.getUserPosts(userId),
            this.usersService.getUserVideos(userId)
          ]).pipe(
            map(([profile, posts, videos]) => [profile, posts, videos] as [User | null, Post[], VideoPost[]])
          );
        } else if (currentUser && (currentUser as User)._id) { // Ensure currentUser is not null and has _id
          return forkJoin([
            this.usersService.getProfile((currentUser as User)._id).pipe(catchError(() => of(null as User | null))), // Handle profile fetch errors
            this.usersService.getUserPosts((currentUser as User)._id),
            this.usersService.getUserVideos((currentUser as User)._id)
          ]).pipe(
            map(([profile, posts, videos]) => [profile, posts, videos] as [User | null, Post[], VideoPost[]])
          );
        } else {
          this.errorMessage = 'User not logged in or profile not found.';
          this.loadingProfile = false;
          return of([null, [], []]).pipe(
            map(([profile, posts, videos]) => [profile, posts, videos] as [User | null, Post[], VideoPost[]])
          );
        }
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data) => {
        if (data && data[0]) {
          const [userProfile, userPosts, userVideos] = data;
          this.profileUser = userProfile;
          this.posts = userPosts;
          this.videoPosts = userVideos;

          if (this.authService.currentUserSubject.value?._id === this.profileUser._id) {
            this.authService.setCurrentUser(userProfile);
          }
        } else if (data && data[0] === null) {
           // Handle case where profile fetch returned null (e.g., user not found or error)
           this.profileUser = null;
           this.posts = [];
           this.videoPosts = [];
           this.errorMessage = 'User profile not found or could not be loaded.';
        }
        this.loadingProfile = false;
        this.loadFilteredContent();
      },
      error: (err: any) => {
        console.error('Error loading profile data:', err);
        this.errorMessage = 'Failed to load profile data.';
        this.loadingProfile = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
    this.profileReloadTrigger.complete();
  }

  loadFilteredContent(): void {
    if (!this.profileUser) return;
    const userId = this.profileUser._id;

    this.loadingContent = true;
    this.errorMessage = null;

    let contentObservable: Observable<Post[] | VideoPost[]>;
    if (this.activeTab === 'posts') {
      contentObservable = this.usersService.getUserPosts(userId, this.searchQuery);
    } else if (this.activeTab === 'videos') {
      contentObservable = this.usersService.getUserVideos(userId, this.searchQuery);
    } else {
      this.loadingContent = false;
      return;
    }

    contentObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: Post[] | VideoPost[]) => {
        if (this.activeTab === 'posts') {
          this.posts = data as Post[];
        } else if (this.activeTab === 'videos') {
          this.videoPosts = data as VideoPost[];
        }
        this.loadingContent = false;
      },
      error: (err: any) => {
        console.error(`Error loading user ${this.activeTab}:`, err);
        this.errorMessage = `Failed to load user ${this.activeTab}.`;
        this.loadingContent = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadFilteredContent();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  followUser(): void {
    if (!this.profileUser || this.followLoading) return;
    this.followLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.usersService.followUser(this.profileUser._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.followLoading = false;
        this.successMessage = `You are now following ${this.profileUser!.username}!`;
        this.profileReloadTrigger.next(); // Trigger a reload of profile data
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err: any) => {
        this.followLoading = false;
        console.error('Error following user:', err);
        this.errorMessage = 'Failed to follow user. Please try again.';
      }
    });
  }

  unfollowUser(): void {
    if (!this.profileUser || this.followLoading) return;
    this.followLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.usersService.unfollowUser(this.profileUser._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.followLoading = false;
        this.successMessage = `You unfollowed ${this.profileUser!.username}.`;
        this.profileReloadTrigger.next(); // Trigger a reload of profile data
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err: any) => {
        this.followLoading = false;
        console.error('Error unfollowing user:', err);
        this.errorMessage = 'Failed to unfollow user. Please try again.';
      }
    });
  }

  isFollowing(): boolean {
    if (!this.profileUser || !this.authService.isAuthenticated() || !this.authService.currentUserSubject.value) return false;
    const currentUserId = this.authService.currentUserSubject.value._id;
    return this.profileUser.followers?.some((follower: any) => follower._id === currentUserId || follower === currentUserId) || false;
  }

  isMyProfile(): boolean {
    if (!this.profileUser || !this.authService.isAuthenticated() || !this.authService.currentUserSubject.value) return false;
    return this.profileUser._id === this.authService.currentUserSubject.value._id;
  }

  openFollowersModal(): void {
    if (!this.profileUser) return;
    this.usersService.getFollowers(this.profileUser._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: users => {
        this.modalTitle = 'Followers';
        this.modalUsers = users;
        this.isModalOpen = true;
      },
      error: (err: any) => {
        console.error('Error fetching followers:', err);
        this.errorMessage = 'Failed to fetch followers.';
      }
    });
  }

  openFollowingModal(): void {
    if (!this.profileUser) return;
    this.usersService.getFollowing(this.profileUser._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: users => {
        this.modalTitle = 'Following';
        this.modalUsers = users;
        this.isModalOpen = true;
      },
      error: (err: any) => {
        console.error('Error fetching following:', err);
        this.errorMessage = 'Failed to fetch following.';
      }
    });
  }

  onCloseModal(): void {
    this.isModalOpen = false;
  }

  editPost(postId: string): void {
    this.router.navigate(['/posts/edit', postId]);
  }

  deletePost(postId: string): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postsService.deletePost(postId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.errorMessage = null;
          this.profileReloadTrigger.next(); // Refresh posts on successful deletion
        },
        error: (err: any) => {
          console.error('Error deleting post:', err);
          this.errorMessage = 'Failed to delete post. Please try again.';
        }
      });
    }
  }

  editVideoPost(videoPostId: string): void {
    this.router.navigate(['/videos/edit', videoPostId]);
  }

  deleteVideoPost(videoPostId: string): void {
    if (confirm('Are you sure you want to delete this video post?')) {
      this.videosService.deleteVideo(videoPostId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.errorMessage = null;
          this.profileReloadTrigger.next(); // Refresh video posts on successful deletion
        },
        error: (err: any) => {
          console.error('Error deleting video post:', err);
          this.errorMessage = 'Failed to delete video post. Please try again.';
        }
      });
    }
  }
}
