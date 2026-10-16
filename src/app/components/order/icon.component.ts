import { Component, computed, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { Utensils, LayoutDashboard, History, Search, Bell, Download, WifiOff, ShoppingBag, ChefHat, Check, Clock, Flame, ArrowRight, RefreshCw, Drumstick, Beef, CupSoda, Salad, X } from 'lucide';
const icons: Record<string, [string, Record<string, string | number | undefined>][]> = { Utensils, LayoutDashboard, History, Search, Bell, Download, WifiOff, ShoppingBag, ChefHat, Check, Clock, Flame, ArrowRight, RefreshCw, Drumstick, Beef, CupSoda, Salad, X };
@Component({selector: 'app-icon', standalone: true, template: '<span [innerHTML]="svg()"></span>', styles: [':host{display:inline-flex;width:20px;height:20px;flex-shrink:0}span{display:contents}']})
export class IconComponent {
  name = input('Utensils');
  private sanitizer = inject(DomSanitizer);
  svg = computed(() => this.sanitizer.bypassSecurityTrustHtml('<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[this.name()] || icons['Utensils']).map(([tag, attrs]) => '<' + tag + ' ' + Object.entries(attrs).map(([key,value]) => key + '="' + value + '"').join(' ') + ' />').join('') + '</svg>'));
}
