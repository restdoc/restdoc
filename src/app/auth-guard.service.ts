import { Inject, Injectable } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from "@angular/router";
import { Observable } from "rxjs";

import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthGuardService implements CanActivate {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
  ) {
    //this.cookieService.set( 'Test', 'Hello World' );
    //this.cookieValue = this.cookieService.get('Test');
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return true;
  }
}
