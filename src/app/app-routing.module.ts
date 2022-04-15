import { ManageLabelComponent } from "./main/manage-label/manage-label.component";
import { DetailsComponent } from "./main/details/details.component";
import { APIlistComponent } from "./main/apilist/apilist.component";
import { APP_INITIALIZER, ErrorHandler, NgModule } from "@angular/core";
import { Router } from "@angular/router";
import {
  RouterModule,
  Routes,
  UrlSegment,
  UrlSegmentGroup,
} from "@angular/router";
import * as Sentry from "@sentry/angular";

import { MainComponent } from "./main/main.component";
import { LabelSettingsComponent } from "./main/settings/label-settings/label-settings.component";
import { GeneralSettingsComponent } from "./main/settings/general-settings/general-settings.component";
import { LabelsResolver } from "./main/main.service";
import { SearchResolver } from "./main/main.service";
//import { AuthGuardService as AuthGuard } from './auth-guard.service';

const routes: Routes = [
  {
    path: "",
    redirectTo: "project/0",
    pathMatch: "full",
  },
  {
    path: "settings",
    component: MainComponent,
    canActivate: [],
    runGuardsAndResolvers: "paramsOrQueryParamsChange",
    children: [
      {
        path: "",
        redirectTo: "general",
        pathMatch: "full",
      },
      {
        path: "general",
        component: GeneralSettingsComponent,
        runGuardsAndResolvers: "always",
        resolve: {},
      },
      {
        path: "label",
        component: LabelSettingsComponent,
        runGuardsAndResolvers: "always",
        resolve: {},
      },
    ],
  },
  {
    path: "",
    component: MainComponent,
    canActivate: [],
    runGuardsAndResolvers: "pathParamsChange",
    children: [
      {
        matcher: mails,
        component: APIlistComponent,
      },
    ],
    resolve: {
      labels: LabelsResolver,
    },
  },
  {
    path: "manage-label",
    canActivate: [],
    runGuardsAndResolvers: "always",
    component: ManageLabelComponent,
  },
];

export function mails(url: UrlSegment[]) {
  var params = { consumed: url, posParams: {} };
  if (url.length == 1) {
    var label = "";
    var path = url[0].path;
    switch (path) {
      case "advancedsearch":
        label = path;
        break;
      case "search":
        label = path;
      case "create-filter":
        label = path;
      default:
    }

    if (label != "") {
      params.posParams["label"] = label;
      return params;
    } else {
      return null;
    }
  }

  if (url.length == 2) {
    params.posParams["label"] = url[1].path;
    return params;
  }

  if (url.length == 3) {
    params.posParams["label"] = url[1].path;
    params.posParams["id"] = url[2].path;
    return params;
  }
  return null;
}

export function matcher(url: UrlSegment[]) {
  if (url.length >= 1) {
    const path = url[0].path;
    var params = { consumed: url, posParams: {} };
    if (url.length > 1) {
      var id = url[1];
      params.posParams = { id: id };
    }
    switch (path) {
      case "inbox":
        return params;
        break;
      case "starred":
        return { consumed: url };
        break;
      case "important":
        return { consumed: url };
        break;
      case "snoozed":
        return { consumed: url };
        break;
      case "draft":
        return { consumed: url };
        break;
      case "all":
        return { consumed: url };
        break;
      case "spam":
        return { consumed: url };
        break;
      case "trash":
        return { consumed: url };
        break;
      default:
        return null;
    }
  }
  return null;
}

@NgModule({
  //imports: [ RouterModule.forRoot(routes,  { useHash: true, onSameUrlNavigation: 'reload', relativeLinkResolution: 'legacy' }) ],
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      onSameUrlNavigation: "reload",
    }),
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    LabelsResolver,
    SearchResolver,
  ],
})
export class AppRoutingModule {}
