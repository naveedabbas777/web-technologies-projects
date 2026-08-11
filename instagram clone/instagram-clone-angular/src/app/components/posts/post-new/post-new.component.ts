import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostsService } from '../../../services/posts.service';

@Component({
  selector: 'app-post-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-new.component.html',
  styleUrls: ['./post-new.component.css']
})
export class PostNewComponent {
  title = '';
  caption = '';
  image: File | null = null;
  imagePreview: string | null = null;
  errorMessage: string | null = null; // Added for error messages

  constructor(
    private postsService: PostsService,
    private router: Router
  ) {}

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
    this.errorMessage = null; // Clear previous errors

    if (!this.title) {
      this.errorMessage = 'Title is required.';
      return;
    }
    if (!this.caption) {
      this.errorMessage = 'Caption is required.';
      return;
    }
    if (!this.image) {
      this.errorMessage = 'Image is required.';
      return;
    }

    this.postsService.createPost(this.title, this.caption, this.image).subscribe({
      next: (response) => {
        console.log('Post created successfully:', response);
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        console.error('Error creating post:', err);
        this.errorMessage = err.error?.msg || 'Failed to create post. Please try again.';
      }
    });
  }
}

