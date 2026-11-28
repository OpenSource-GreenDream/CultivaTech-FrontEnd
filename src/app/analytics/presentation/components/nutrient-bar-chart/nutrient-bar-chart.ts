import {Component, computed, input} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

type NutrientAverage = {
  parameter: string;
  symbol: string;
  unit: string;
  avg: number | null;
  count: number;
};

@Component({
  selector: 'app-nutrient-bar-chart',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="chart-shell">
      <div class="chart-header">
        <div>
          <h4>{{ title() }}</h4>
          <span class="unit">{{ unit() }}</span>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="bar-legend"></span> {{ legend() }}</span>
        </div>
      </div>

      @if (data().length === 0 || !hasData()) {
        <div class="chart-empty">{{ 'analytics.no-nutrient-readings' | translate }}</div>
      } @else {
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="chart-svg">
          @for (tick of yTicks(); track tick) {
            <line [attr.x1]="padding" [attr.y1]="tick.y" [attr.x2]="width - padding" [attr.y2]="tick.y" class="grid-line" />
            <text [attr.x]="padding - 8" [attr.y]="tick.y + 4" class="axis-label y-label">{{ tick.value }}</text>
          }

          <line [attr.x1]="padding" [attr.y1]="height - padding" [attr.x2]="width - padding" [attr.y2]="height - padding" class="axis-line" />

          @for (bar of bars(); track bar.symbol) {
            @if (bar.avg !== null) {
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" class="bar" rx="4" />
              <text [attr.x]="bar.x + bar.width / 2" [attr.y]="bar.y - 6" text-anchor="middle" class="bar-value">{{ bar.avg }}</text>
            }
            <text [attr.x]="bar.x + bar.width / 2" [attr.y]="height - padding + 16" text-anchor="middle" class="axis-label x-label">{{ bar.symbol }}</text>
            <text [attr.x]="bar.x + bar.width / 2" [attr.y]="height - padding + 30" text-anchor="middle" class="count-label">{{ bar.count }}</text>
          }
        </svg>
      }
    </div>
  `,
  styles: [`
    .chart-shell { background:#F8F7F3; border:1px solid #C9C6B5; border-radius:12px; padding:16px; }
    .chart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
    .chart-header h4 { margin:0; font-size:1rem; font-weight:600; color:#303A28; }
    .unit { font-size:0.8rem; color:#68725E; margin-left:6px; }
    .legend { display:flex; gap:12px; font-size:0.8rem; color:#59634E; }
    .legend-item { display:flex; align-items:center; gap:6px; }
    .bar-legend { width:12px; height:12px; border-radius:2px; display:inline-block; background:#66794A; }
    .chart-empty { padding:40px; text-align:center; color:#68725E; font-style:italic; }
    .chart-svg { width:100%; height:auto; overflow:visible; }
    .grid-line { stroke:#E8E1D3; stroke-width:1; }
    .axis-line { stroke:#C9C6B5; stroke-width:1; }
    .axis-label { font-size:10px; fill:#68725E; }
    .x-label { font-weight:600; }
    .count-label { font-size:9px; fill:#68725E; }
    .bar { fill:#66794A; }
    .bar-value { font-size:10px; fill:#303A28; font-weight:600; }
  `]
})
export class NutrientBarChartComponent {
  readonly data = input<NutrientAverage[]>([]);
  readonly title = input<string>('');
  readonly unit = input<string>('');
  readonly legend = input<string>('');

  readonly width = 640;
  readonly height = 320;
  readonly padding = 40;

  readonly hasData = computed(() => this.data().some((d) => d.avg !== null && d.count > 0));

  readonly maxValue = computed(() => {
    const vals = this.data().map((d) => d.avg).filter((v): v is number => v !== null);
    if (vals.length === 0) return 0;
    return Math.max(...vals, 0);
  });

  readonly bars = computed(() => {
    const data = this.data();
    const count = data.length || 1;
    const innerW = this.width - this.padding * 2;
    const innerH = this.height - this.padding * 2;
    const gap = 12;
    const barW = Math.max(8, (innerW - gap * (count - 1)) / count);
    const max = this.maxValue() || 1;
    return data.map((d, i) => {
      const avg = d.avg;
      const h = avg === null ? 0 : (avg / max) * innerH;
      const x = this.padding + i * (barW + gap);
      const y = this.height - this.padding - h;
      return {
        ...d,
        avg: avg === null ? null : Number(avg.toFixed(2)),
        x,
        y,
        width: barW,
        height: h,
      };
    });
  });

  readonly yTicks = computed(() => {
    const max = this.maxValue();
    if (max <= 0) return [];
    const ticks = 4;
    const innerH = this.height - this.padding * 2;
    return Array.from({ length: ticks + 1 }, (_, i) => {
      const value = (max * i) / ticks;
      const y = this.height - this.padding - (value / max) * innerH;
      return { value: Number(value.toFixed(2)), y };
    });
  });
}
