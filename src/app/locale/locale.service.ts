import { Injectable } from '@angular/core';

@Injectable()
export class LocaleService {

  //Chosse Locale From This Link
  //https://github.com/angular/angular/tree/master/packages/common/locales
  constructor() { }

  private _locale: string;

  set locale(value: string) {
    this._locale = value;
  }
  get locale(): string {
    return this._locale || 'en-US';
  }

  public registerCulture(culture: string) {
    debugger;
    if (!culture) {
      return;
    }
    switch (culture) {
      case 'en-us': {
            this._locale = 'en-us';
            break;
      }
      case 'en-uk': {
        this._locale = 'en';
        break;
      }
      case 'zh-hk': {
        this._locale = 'zh-Hant';
        break;
      }
      case 'zh-hans': {
        this._locale = 'zh-hans';
        break;
      }
      case 'zh-cn': {
        this._locale = 'zh-Hans';
        break;
      }
      default: {
        this._locale = 'en-us';
        break;
      }
    }
  }
}