import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-help-tutorials',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './help-tutorials.component.html',
  styleUrls: ['./help-tutorials.component.css']
})
export class HelpTutorialsComponent implements OnInit {
  helpVideos: any[] = [];
  selectedVideo: any = null;
  safeEmbedUrl: SafeResourceUrl | null = null;
  loading = true;
  searchQuery = '';
  isAdmin = false;
  isUfsUser = false;
  copied = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      const username = (user?.username || '').toLowerCase().trim();
      const email = (user?.email || '').toLowerCase().trim();
      this.isUfsUser = username === 'ufs' || email === 'ufs' || email === 'ufs@trackbox.in';
    });

    this.loadVideos();
  }

  loadVideos(): void {
    this.loading = true;
    this.api.get('/help-video').subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.success && (res.videos?.length > 0 || res.data)) {
          this.helpVideos = res.videos || (res.data ? [res.data] : []);

          // Check if an ID was passed in query params
          const requestedId = this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.queryParamMap.get('v');
          let matched = null;
          if (requestedId) {
            matched = this.helpVideos.find(v => String(v.id) === String(requestedId));
          }
          this.selectVideo(matched || this.helpVideos[0]);
        } else {
          this.helpVideos = [];
          this.selectedVideo = null;
          this.safeEmbedUrl = null;
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Failed to load help videos', err);
      }
    });
  }

  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const str = String(url).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = str.match(regExp);
    return match ? match[1] : null;
  }

  getYouTubeThumbnail(url: string): string {
    const id = this.extractYouTubeId(url);
    if (id) {
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    }
    return '';
  }

  selectVideo(video: any): void {
    if (!video) return;
    this.selectedVideo = video;
    const ytId = this.extractYouTubeId(video.video_url);

    if (ytId) {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else if (video.video_url) {
      // Standard video file fallback if not a YouTube link
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(video.video_url);
    } else {
      this.safeEmbedUrl = null;
    }

    // Update query param without triggering full reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: video.id },
      queryParamsHandling: 'merge'
    });

    // Smooth scroll to player on mobile
    if (window.innerWidth < 992) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get filteredVideos(): any[] {
    if (!this.searchQuery.trim()) {
      return this.helpVideos;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.helpVideos.filter(v =>
      (v.title && v.title.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    );
  }

  copyShareLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Video link copied to clipboard!',
        showConfirmButton: false,
        timer: 2000
      });
    });
  }

  openOnYouTube(url: string): void {
    if (!url) return;
    const ytId = this.extractYouTubeId(url);
    const targetUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : url;
    window.open(targetUrl, '_blank');
  }

  goBack(): void {
    window.history.back();
  }
}
