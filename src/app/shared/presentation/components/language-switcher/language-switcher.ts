import {Component, inject} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  imports: [],
  selector: 'app-language-switcher',
  styleUrl: './language-switcher.css',
  templateUrl: './language-switcher.html',
})
export class LanguageSwitcher {
  private translate = inject(TranslateService);

  ngOnInit(): void {
    if (!this.translate.currentLang) {
      this.translate.setFallbackLang('en');
      this.translate.use('en');
    }
  }

  get currentLang(): string{
    const langSignal = this.translate.currentLang;
    if (typeof langSignal === 'function') {
      return langSignal() || 'en';
    }

    return (langSignal as unknown as string) || this.translate.getCurrentLang() || 'en';
  }

  setLanguage(lang: string): void {
    if (this.currentLang !== lang){
      this.translate.use(lang);
    }
  }
}
