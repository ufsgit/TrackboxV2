import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompanyConfig {
  id?: number;
  name: string;
  title: string;
  is_email: number | boolean;
  logo: string;
  favicon: string;
  company_status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyConfigService {
  private readonly storageKey = 'uc_company_config';
  private apiUrl = environment.apiUrl;
  private backendBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  private configSubject = new BehaviorSubject<CompanyConfig | null>(null);
  public config$: Observable<CompanyConfig | null> = this.configSubject.asObservable();

  constructor(private http: HttpClient) {
    // 1. Immediately hydrate from localStorage for zero-flicker loading
    const cached = this.getCachedConfig();
    if (cached) {
      this.configSubject.next(cached);
      this.applyHeadElements(cached);
    }
  }

  /**
   * Load active company config from backend API (company_status = 1 LIMIT 1)
   */
  public loadConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/company-config/active`).pipe(
      tap((res) => {
        if (res && res.success && res.data) {
          const config: CompanyConfig = res.data;
          this.setStoredConfig(config);
          this.configSubject.next(config);
          this.applyHeadElements(config);
        }
      }),
      catchError((err) => {
        console.warn('⚠️ Could not fetch remote company config, using fallback:', err?.message);
        const fallback = this.getCachedConfig() || this.getDefaultConfig();
        this.configSubject.next(fallback);
        this.applyHeadElements(fallback);
        return of(fallback);
      })
    );
  }

  public getConfig(): CompanyConfig | null {
    return this.configSubject.value || this.getCachedConfig() || this.getDefaultConfig();
  }

  /**
   * Returns true if email functionality is enabled (is_email = 1)
   */
  public isEmailEnabled(): boolean {
    const cfg = this.getConfig();
    if (!cfg) return false;
    return Number(cfg.is_email) === 1 || cfg.is_email === true;
  }

  public getCompanyName(): string {
    return this.getConfig()?.name || 'Trackbox';
  }

  public getPageTitle(): string {
    return this.getConfig()?.title || this.getCompanyName();
  }

  /**
   * Cleans path from backslashes or leading backend/src/
   */
  private cleanAssetPath(p: string | undefined): string {
    if (!p) return '';
    return p.replace(/\\/g, '/').replace(/^(\/?backend\/src\/)+/i, '').replace(/^\/+/, '');
  }

  /**
   * Resolves full URL for the company logo
   */
  public getLogoUrl(): string {
    const rawLogo = this.getConfig()?.logo;
    if (!rawLogo) return 'assets/logo.png';
    if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) return rawLogo;
    const logo = this.cleanAssetPath(rawLogo);
    return `${this.backendBaseUrl}/${logo}`;
  }

  /**
   * Resolves full URL for the favicon
   */
  public getFaviconUrl(): string {
    const rawFavicon = this.getConfig()?.favicon;
    if (!rawFavicon) return 'favicon.ico';
    if (rawFavicon.startsWith('http://') || rawFavicon.startsWith('https://')) return rawFavicon;
    const favicon = this.cleanAssetPath(rawFavicon);
    return `${this.backendBaseUrl}/${favicon}`;
  }

  /**
   * Applies page title and favicon link in browser tab
   */
  private applyHeadElements(config: CompanyConfig): void {
    if (typeof document === 'undefined') return;

    if (config.title) {
      document.title = config.title;
    }

    if (config.favicon) {
      const faviconUrl = this.getFaviconUrl();
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }

  private getCachedConfig(): CompanyConfig | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      const parsed: CompanyConfig = JSON.parse(stored);
      if (parsed && parsed.id === 0) {
        parsed.is_email = 0;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private setStoredConfig(config: CompanyConfig): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save company_config in localStorage', e);
    }
  }

  private getDefaultConfig(): CompanyConfig {
    return {
      id: 0,
      name: 'Trackbox',
      title: 'Trackbox CRM',
      is_email: 0,
      logo: 'assets/logos/trackbox-logo.png',
      favicon: 'assets/icons/trackbox-logo.png',
      company_status: 1
    };
  }
}

