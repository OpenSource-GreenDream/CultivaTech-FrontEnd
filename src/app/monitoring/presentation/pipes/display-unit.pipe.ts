import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'displayUnit',
  standalone: true,
})
export class DisplayUnitPipe implements PipeTransform {
  transform(unit: string | null | undefined, parameter?: string | null): string {
    const normalizedUnit = (unit ?? '').trim();
    const normalizedParameter = (parameter ?? '').trim().toUpperCase();

    if (normalizedParameter === 'PH' || normalizedUnit.toLowerCase() === 'unitless') {
      return 'pH';
    }

    return normalizedUnit;
  }
}