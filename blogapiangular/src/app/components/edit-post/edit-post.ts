import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/post';
import { Post } from '../../services/post';

@Component({
  selector: 'app-edit-post',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-post.html',
  styleUrl: './edit-post.scss',
})
export class EditPost implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);

  postForm: FormGroup;
  post = signal<Post | null>(null);

  constructor() {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      author: ['', Validators.required],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postService.getPost(+id).subscribe({
        next: (post) => {
          this.post.set(post);
          this.postForm.patchValue(post);
        },
        error: (err) => console.error('Error fetching post:', err),
      });
    }
  }

  onSubmit() {
    if (this.postForm.valid && this.post()) {
      const updatedPost: Post = { ...this.post()!, ...this.postForm.value };
      this.postService.updatePost(updatedPost.id!, updatedPost).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => console.error('Error updating post:', err),
      });
    }
  }
}
