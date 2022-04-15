import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HotkeysCheatsheetComponent } from './hotkeys-cheatsheet.component';

describe('HotkeysCheatsheetComponent', () => {
    let component: HotkeysCheatsheetComponent;
    let fixture: ComponentFixture<HotkeysCheatsheetComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HotkeysCheatsheetComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HotkeysCheatsheetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
