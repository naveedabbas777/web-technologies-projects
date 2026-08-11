import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  collapsed = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem('sidebarCollapsed');
      this.collapsed = saved === 'true';
    } catch (e) {
      this.collapsed = false;
    }
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    try { localStorage.setItem('sidebarCollapsed', String(this.collapsed)); } catch (e) {}
  }

  confirmLogout(): void {
    if (confirm("Are you sure you want to log out?")) {
      this.authService.logout();
    }
  }
}


