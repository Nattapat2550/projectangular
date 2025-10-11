import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { apiInterceptor } from './app/core/interceptors/api.interceptor';


bootstrapApplication(AppComponent, {
providers: [
provideRouter(routes),
provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),
provideAnimations()
]
}).catch(console.error);