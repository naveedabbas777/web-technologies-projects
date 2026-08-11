import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { VideosService, VideoPost } from '../../../services/videos.service';

@Component({
  selector: 'app-video-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-edit.component.html',
  styleUrls: ['./video-edit.component.css']
})
export class VideoEditComponent implements OnInit {
  videoPost: VideoPost | null = null;
  title = '';
  description = '';
  video: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private videosService: VideosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.videosService.getVideo(id).subscribe({
        next: (video) => {
          this.videoPost = video;
          this.title = video.title;
          this.description = video.description;
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.video = input.files[0];
    }
  }

  onSubmit(): void {
    if (!this.videoPost) return;
    this.videosService.updateVideo(this.videoPost._id, this.title, this.description, this.video || undefined).subscribe({
      next: () => this.router.navigate(['/videos', this.videoPost!._id]),
      error: (err: any) => console.error('Error updating video:', err)
    });
  }
}

