import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-my-posts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-posts.component.html',
  styleUrls: ['./my-posts.component.css']
})
export class MyPostsComponent implements OnInit {
  posts: any[] = [];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.getMyPosts().subscribe({
      next: (data: any) => {
        this.posts = data.posts || [];
      }
    });
  }
}

