import { Routes } from '@angular/router';
import { PostList } from './components/post-list/post-list';
import { PostDetail } from './components/post-detail/post-detail';
import { AddPost } from './components/add-post/add-post';
import { EditPost } from './components/edit-post/edit-post';

export const routes: Routes = [
  { path: '', component: PostList },
  { path: 'post/:id', component: PostDetail },
  { path: 'add', component: AddPost },
  { path: 'edit/:id', component: EditPost },
  { path: '**', redirectTo: '' },
];
