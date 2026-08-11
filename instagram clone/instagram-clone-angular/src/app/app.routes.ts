import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { PostDetailComponent } from './components/posts/post-detail/post-detail.component';
import { PostNewComponent } from './components/posts/post-new/post-new.component';
import { PostEditComponent } from './components/posts/post-edit/post-edit.component';
import { VideoFeedComponent } from './components/videos/video-feed/video-feed.component';
import { VideoNewComponent } from './components/videos/video-new/video-new.component';
import { VideoDetailComponent } from './components/videos/video-detail/video-detail.component';
import { VideoEditComponent } from './components/videos/video-edit/video-edit.component';
import { UserProfileComponent } from './components/users/user-profile/user-profile.component';
import { UserProfileEditComponent } from './components/users/user-profile-edit/user-profile-edit.component';
import { MyPostsComponent } from './components/users/my-posts/my-posts.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminPostsComponent } from './components/admin/admin-posts/admin-posts.component';
import { AdminCommentsComponent } from './components/admin/admin-comments/admin-comments.component';
import { AdminUserPostsComponent } from './components/admin/admin-user-posts/admin-user-posts.component';
import { AdminUserCommentsComponent } from './components/admin/admin-user-comments/admin-user-comments.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/signup', component: SignupComponent },
  { path: 'posts/new', component: PostNewComponent, canActivate: [authGuard] },
  { path: 'posts/:id', component: PostDetailComponent },
  { path: 'posts/:id/edit', component: PostEditComponent, canActivate: [authGuard] },
  { path: 'videos', component: VideoFeedComponent },
  { path: 'videos/new', component: VideoNewComponent, canActivate: [authGuard] },
  { path: 'videos/:id', component: VideoDetailComponent },
  { path: 'videos/:id/edit', component: VideoEditComponent, canActivate: [authGuard] },
  { path: 'users/profile', component: UserProfileComponent, canActivate: [authGuard] },
  { path: 'users/profile/edit', component: UserProfileEditComponent, canActivate: [authGuard] },
  { path: 'users/myposts', component: MyPostsComponent, canActivate: [authGuard] },
  { path: 'users/:userId/profile', component: UserProfileComponent },
  { path: 'users', component: AdminUsersComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/posts-management', component: AdminPostsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/comments-management', component: AdminCommentsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/:userId/posts', component: AdminUserPostsComponent, canActivate: [authGuard, adminGuard] },
  { path: 'users/:userId/comments', component: AdminUserCommentsComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' }
];

