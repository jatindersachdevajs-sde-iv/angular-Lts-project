import { Injectable } from '@angular/core';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  checkTokenOnly: boolean = false;
    constructor(protected router: Router ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (localStorage.getItem('isLoggedin')) {
            // logged in so return true
            return true;
        }
        this.router.navigate(['/auth/login']);
        return false;
    }
}
