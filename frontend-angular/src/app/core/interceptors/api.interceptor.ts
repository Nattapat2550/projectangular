import { HttpInterceptorFn } from '@angular/common/http';


export const apiInterceptor: HttpInterceptorFn = (req, next) => {
// Always send cookies to backend domain
const withCred = req.clone({ withCredentials: true });
return next(withCred);
};