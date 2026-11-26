import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {AuthService} from '../application/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const session = authService.session();
  const backendBase = environment.cultivatechBaseApi;

  const isBackendRequest = backendBase !== '' && request.url.startsWith(backendBase);
  const isAuthEndpoint =
    request.url.includes('/authentication/sign-in') ||
    request.url.includes('/authentication/sign-up');

  if (session && !authService.isExpired(session) && isBackendRequest && !isAuthEndpoint) {
    request = request.clone({
      setHeaders: {
        Authorization: `${session.tokenType} ${session.accessToken}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isBackendRequest) {
        const currentSession = authService.session();
        if (currentSession && currentSession.accessToken === session?.accessToken) {
          authService.signOut();
        }
      }
      return throwError(() => error);
    }),
  );
};
