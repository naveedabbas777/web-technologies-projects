import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VideosService } from '../../../services/videos.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-video-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-new.component.html',
  styleUrls: ['./video-new.component.css']
})
export class VideoNewComponent implements OnDestroy {
  title = '';
  description = '';
  video: File | null = null;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private videosService: VideosService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        type: file.type
      });

      // Basic validation for video file types
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = `Invalid file type: ${file.type}. Please select MP4, WebM, Ogg, MOV, or AVI.`;
        this.video = null;
        console.error(`❌ Invalid file type: ${file.type}`);
        return;
      }

      // Check file size (soft check - server will do final validation)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        this.errorMessage = `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed is 100MB.`;
        this.video = null;
        console.error(`❌ File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
        return;
      }

      this.video = file;
      this.errorMessage = null; // Clear error if a valid file is selected
      console.log(`✅ File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)}MB) selected successfully`);
    }
  }

  onSubmit(): void {
    this.errorMessage = null; // Clear previous errors
    this.successMessage = null;

    console.log('🔍 Validating form data...');

    // Validate title
    if (!this.title.trim()) {
      this.errorMessage = 'Video title is required.';
      console.error('❌ Validation failed: Title is empty');
      return;
    }

    // Validate description
    if (!this.description.trim()) {
      this.errorMessage = 'Video description is required.';
      console.error('❌ Validation failed: Description is empty');
      return;
    }

    // Validate video file
    if (!this.video) {
      this.errorMessage = 'Video file is required.';
      console.error('❌ Validation failed: No video file selected');
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(this.video.type)) {
      this.errorMessage = 'Please select a valid video file (MP4, WebM, Ogg, MOV, or AVI).';
      console.error(`❌ Validation failed: Invalid file type "${this.video.type}"`);
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (this.video.size > maxSize) {
      this.errorMessage = 'Video file size must be less than 100MB.';
      console.error(`❌ Validation failed: File too large (${(this.video.size / (1024 * 1024)).toFixed(2)}MB > 100MB)`);
      return;
    }

    console.log('✅ Client-side validation passed, starting upload...');
    this.loading = true;

    console.log('🚀 Starting video upload...');
    console.log('Upload data:', {
      title: this.title,
      description: this.description,
      videoFile: this.video ? {
        name: this.video.name,
        size: this.video.size,
        sizeMB: (this.video.size / (1024 * 1024)).toFixed(2) + 'MB',
        type: this.video.type
      } : 'No file selected'
    });

    this.videosService.createVideo(this.title, this.description, this.video).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ Video created successfully:', response);
        this.loading = false;
        this.successMessage = `Video "${this.title}" uploaded successfully! Redirecting...`;

        // Clear success message and navigate after 2 seconds
        setTimeout(() => {
          this.successMessage = null;
          this.router.navigate(['/videos']);
        }, 2000);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('❌ Video upload failed:', err);

        // Extract detailed error information
        let errorMessage = 'Failed to upload video. Please try again.';

        if (err.error?.msg) {
          errorMessage = err.error.msg;
        } else if (err.error?.error) {
          errorMessage = `Upload error: ${err.error.error}`;
        } else if (err.message) {
          errorMessage = `Network error: ${err.message}`;
        } else if (err.status === 413) {
          errorMessage = 'Video file is too large. Please choose a smaller file.';
        } else if (err.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.status === 403) {
          errorMessage = 'You do not have permission to upload videos.';
        } else if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }

        this.errorMessage = errorMessage;
        console.error(`❌ Video upload failed: ${errorMessage}`);
        console.error('Full error details:', err);
      }
    });
  }
}
