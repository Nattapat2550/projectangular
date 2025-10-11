
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let url = req.url;
  if (!/^https?:\/\//i.test(url)) {
    url = environment.apiBaseUrl.replace(/\/$/, '') + '/' + req.url.replace(/^\//, '');
  }
  const token = localStorage.getItem('token');
  const authReq = req.clone({
    url,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return next(authReq);
};
