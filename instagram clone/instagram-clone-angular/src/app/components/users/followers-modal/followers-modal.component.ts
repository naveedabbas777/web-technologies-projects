import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../services/auth.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';
@Component({
  selector: 'app-followers-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, OneClickNavDirective],
  templateUrl: './followers-modal.component.html',
  styleUrls: ['./followers-modal.component.css']
})
export class FollowersModalComponent {
  @Input() title = 'Users';
  @Input() users: User[] = [];
  @Output() closeModal = new EventEmitter<void>();

  searchTerm = '';

  get filteredUsers(): User[] {
    if (!this.searchTerm) {
      return this.users;
    }
    return this.users.filter(user =>
      user.username.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
