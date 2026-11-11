import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import { CompanyConfigService } from './core/services/company-config.service';

export function initCompanyConfig(companyConfigService: CompanyConfigService) {
  return () => companyConfigService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initCompanyConfig,
      deps: [CompanyConfigService],
      multi: true
    }
  ]
};
