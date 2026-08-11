import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[oneClickNav]',
  standalone: true
})
export class OneClickNavDirective {
  @Input('oneClickNav') path?: string;

  constructor(private el: ElementRef<HTMLElement>, private router: Router) {}

  private getPath(): string | null {
    if (this.path) return this.path;
    const href = (this.el.nativeElement as HTMLAnchorElement).getAttribute('href');
    if (!href) return null;
    // Only handle internal routes (start with /)
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('?')) return href;
    return null;
  }

  private navigate(path: string): void {
    // Directly navigate to the path without debouncing or force-reloading logic
    this.router.navigateByUrl(path);
  }

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    const path = this.getPath();
    if (!path) return;
    event.preventDefault();
    event.stopPropagation();
    this.navigate(path);
  }
}
