import { LOCALE_ID } from "@angular/core";
import {
  NgModule,
  APP_INITIALIZER,
  NO_ERRORS_SCHEMA,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { APP_BASE_HREF, DatePipe } from "@angular/common";
import { from } from "rxjs";

import { ToastrModule } from "ngx-toastr";
import { CodemirrorModule } from "@ctrl/ngx-codemirror";

import { MainComponent, TruncatePipe, SafePipe, SanitizeHtmlPipe } from "./main/main.component";
import { MaterialModule } from "./material.module";
import { AppComponent } from "./app.component";
import { HeaderComponent } from "./header/header.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { AppRoutingModule } from "./app-routing.module";
import { DetailsComponent } from "./main/details/details.component";
import { APIlistComponent } from "./main/apilist/apilist.component";
import { ManageLabelComponent } from "./main/manage-label/manage-label.component";
import { ProjectCreateComponent } from "./dialog/project-create/project-create.component";
import { UploadFileComponent } from "./dialog/upload-file/upload-file.component";
import { SnoozeDateTimeComponent } from "./dialog/snooze-date-time/snooze-date-time.component";
import { HotkeyModule } from "./third/angular2-hotkeys/hotkey.module";
import { IHotkeyOptions } from "./third/angular2-hotkeys/hotkey.options";
import { ProjectRenameComponent } from "./dialog/project-rename/project-rename.component";
import { ProjectEndpointComponent } from "./dialog/project-endpoint/project-endpoint.component";


var hotkeyOption: IHotkeyOptions = {
  disableCheatSheet: false,
  cheatSheetHotkey: "?",
  cheatSheetCloseEsc: true,
  cheatSheetCloseEscDescription: "show or hide",
  cheatSheetDescription: "hello, world<br>",
};

// const appRoutes: Routes = [
//   { path: '', component:MainComponent },
//   {  path: 'logout',component: PageLogoutComponent}
// ];

@NgModule({
    declarations: [
        AppComponent,
        HeaderComponent,
        MainComponent,
        SidebarComponent,
        DetailsComponent,
        APIlistComponent,
        ManageLabelComponent,
        ProjectCreateComponent,
        UploadFileComponent,
        SnoozeDateTimeComponent,
        TruncatePipe,
        SafePipe,
        SanitizeHtmlPipe,
        ProjectRenameComponent,
        ProjectEndpointComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        HotkeyModule.forRoot(hotkeyOption),
        DragDropModule,
        CodemirrorModule,
        // [RouterModule.forRoot(appRoutes)],
        ToastrModule.forRoot({
            timeOut: 3000,
            positionClass: "toast-bottom-left",
            preventDuplicates: true,
        }),
    ],
    exports: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    providers: [DatePipe],
    bootstrap: [AppComponent]
})
export class AppModule {}
