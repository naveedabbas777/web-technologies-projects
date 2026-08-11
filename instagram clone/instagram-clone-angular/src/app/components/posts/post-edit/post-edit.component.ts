import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PostsService, Post } from '../../../services/posts.service';

@Component({
  selector: 'app-post-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-edit.component.html',
  styleUrls: ['./post-edit.component.css']
})
export class PostEditComponent implements OnInit {
  post: Post | null = null;
  title = '';
  caption = '';
  image: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private postsService: PostsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postsService.getPost(id).subscribe({
        next: (post) => {
          this.post = post;
          this.title = post.title;
          this.caption = post.caption;
          if (post.image) {
            this.imagePreview = 'http://localhost:8001' + post.image;
          }
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.image = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.image);
    }
  }

  onSubmit(): void {
    if (!this.post) return;

    this.postsService.updatePost(this.post._id, this.title, this.caption, this.image || undefined).subscribe({
      next: () => {
        this.router.navigate(['/posts', this.post!._id]);
      },
      error: (err: any) => {
        console.error('Error updating post:', err);
      }
    });
  }
}

