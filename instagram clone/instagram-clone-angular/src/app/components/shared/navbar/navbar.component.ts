import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { OneClickNavDirective } from '../../../directives/one-click-nav.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, OneClickNavDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private lastNavAt = 0;
  private lastNavPath = '';

  constructor(public authService: AuthService, private router: Router) {}

  onNavClick(event: Event, path: string): void {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    // Debounce duplicate pointerdown + click events
    if (this.lastNavPath === path && now - this.lastNavAt < 500) {
      console.debug('Navbar: suppressing duplicate navigation', { path, elapsed: now - this.lastNavAt });
      return;
    }
    this.lastNavAt = now;
    this.lastNavPath = path;

    // Blur active element to remove any interfering focus or overlays
    try { (document.activeElement as HTMLElement)?.blur(); } catch (e) {}

    console.debug('Navbar: navigating to', path, 'event type', (event as any).type);
    // If navigating to the current URL, force reload by adding a query param then navigating back
    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl === path) {
      // Force a reload by toggling a temporary query param
      const temp = `_r=${now}`;
      this.router.navigateByUrl(path + (path.includes('?') ? '&' + temp : '?' + temp)).then(() => {
        // Remove temp param without adding a new history entry
        this.router.navigateByUrl(path, { replaceUrl: true });
      });
    } else {
      this.router.navigateByUrl(path);
    }
  }
}

