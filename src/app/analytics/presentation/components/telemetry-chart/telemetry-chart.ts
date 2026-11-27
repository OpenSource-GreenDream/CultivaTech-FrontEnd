import {Component, computed, input, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {DisplayUnitPipe} from '../../../../monitoring/presentation/pipes/display-unit.pipe';

// local type to avoid import path issues
type Reading = {
  id: number;
  deviceId: number;
  parameter: string;
  value: number;
  unit: string;
  recordedAt: string;
};

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  imports: [DatePipe, TranslatePipe, DisplayUnitPipe],
  template: `
    <div class="chart-shell">
      <div class="chart-header">
        <div>
          <h4>{{ parameter() }}</h4>
          <span class="unit">{{ unit() }}</span>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="dot" [style.background]="color()"></span> {{ 'analytics.real-reading' | translate }}</span>
          @if (threshold() !== null) {
            <span class="legend-item"><span class="dot threshold"></span> {{ 'analytics.min-threshold' | translate }}</span>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="chart-empty">{{ 'analytics.loading' | translate }}</div>
      } @else if (readings().length === 0) {
        <div class="chart-empty">{{ 'analytics.no-chart-reports' | translate }}</div>
      } @else {
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="chart-svg" (mousemove)="onMove($event)" (mouseleave)="hovered.set(null)">
          <defs>
            <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.18" />
              <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
            </linearGradient>
          </defs>

          @for (tick of yTicks(); track tick) {
            <line [attr.x1]="padding" [attr.y1]="tick.y" [attr.x2]="width - padding" [attr.y2]="tick.y" class="grid-line" />
            <text [attr.x]="padding - 8" [attr.y]="tick.y + 4" class="axis-label y-label">{{ tick.value }}</text>
          }

          @if (threshold() !== null) {
            <line [attr.x1]="padding" [attr.y1]="thresholdY()" [attr.x2]="width - padding" [attr.y2]="thresholdY()" class="threshold-line" />
          }

          <path [attr.d]="areaPath()" class="area-path" [attr.fill]="'url(#' + gradientId + ')'" />
          <path [attr.d]="linePath()" class="line-path" [attr.stroke]="color()" />

          @for (point of points(); track point.index) {
            <circle [attr.cx]="point.x" [attr.cy]="point.y" [attr.r]="hovered() === point.index ? 6 : 4" class="marker" [attr.fill]="color()" />
          }

          @if (hovered() !== null) {
            @let active = pointAt(hovered()!);
            <line [attr.x1]="active.x" [attr.y1]="padding" [attr.x2]="active.x" [attr.y2]="height - padding" class="crosshair" />
            <g class="tooltip" [attr.transform]="'translate(' + active.x + ',' + active.y + ')'">
              <rect x="-70" y="-72" width="140" height="64" rx="8" class="tooltip-box" />
              <text x="0" y="-52" text-anchor="middle" class="tooltip-text">{{ active.reading.recordedAt | date:'short' }}</text>
              <text x="0" y="-36" text-anchor="middle" class="tooltip-text">{{ active.reading.value }} {{ active.reading.unit | displayUnit:active.reading.parameter }}</text>
              <text x="0" y="-20" text-anchor="middle" class="tooltip-text">{{ parameter() }}</text>
            </g>
          }
        </svg>

        <div class="timeline">
          @for (label of xLabels(); track label.index) {
            <span class="time-label" [style.left.%]="label.percent">{{ label.text }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-shell { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; }
    .chart-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
    .chart-header h4 { margin:0; font-size:1rem; font-weight:600; color:#2d3748; }
    .unit { font-size:0.8rem; color:#718096; margin-left:6px; }
    .legend { display:flex; gap:12px; font-size:0.8rem; color:#4a5568; }
    .legend-item { display:flex; align-items:center; gap:6px; }
    .dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
    .dot.threshold { background:#e53e3e; }
    .chart-empty { padding:40px; text-align:center; color:#a0aec0; font-style:italic; }
    .chart-svg { width:100%; height:auto; overflow:visible; }
    .grid-line { stroke:#edf2f7; stroke-width:1; }
    .axis-label { font-size:10px; fill:#718096; text-anchor:end; }
    .line-path { fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    .area-path { opacity:1; }
    .marker { transition: r 0.15s ease; cursor:pointer; }
    .crosshair { stroke:#a0aec0; stroke-width:1; stroke-dasharray:4; }
    .threshold-line { stroke:#e53e3e; stroke-width:1.5; stroke-dasharray:5; }
    .tooltip-box { fill:#fff; stroke:#e2e8f0; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    .tooltip-text { font-size:10px; fill:#2d3748; }
    .timeline { position:relative; height:24px; margin-top:8px; }
    .time-label { position:absolute; transform:translateX(-50%); font-size:10px; color:#718096; white-space:nowrap; }
  `]
})
export class TelemetryChartComponent {
  readonly readings = input<Reading[]>([]);
  readonly parameter = input<string>('');
  readonly unit = input<string>('');
  readonly threshold = input<number | null>(null);
  readonly loading = input<boolean>(false);
  readonly color = input<string>('#3182ce');

  readonly width = 640;
  readonly height = 320;
  readonly padding = 40;

  readonly hovered = signal<number | null>(null);

  readonly gradientId = `grad-${Math.random().toString(36).slice(2)}`;

  readonly points = computed(() => {
    const data = this.readings();
    if (data.length === 0) return [];
    const times = data.map((r) => new Date(r.recordedAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;
    const values = data.map((r) => r.value);
    const minVal = Math.min(...values, this.threshold() ?? Infinity);
    const maxVal = Math.max(...values, this.threshold() ?? -Infinity);
    const range = maxVal - minVal || 1;
    const innerW = this.width - this.padding * 2;
    const innerH = this.height - this.padding * 2;
    return data.map((r, index) => ({
      index,
      reading: r,
      x: this.padding + ((new Date(r.recordedAt).getTime() - minTime) / timeRange) * innerW,
      y: this.height - this.padding - ((r.value - minVal) / range) * innerH,
    }));
  });

  readonly linePath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return '';
    const base = this.height - this.padding;
    return `${this.linePath()} L ${pts[pts.length - 1].x} ${base} L ${pts[0].x} ${base} Z`;
  });

  readonly yTicks = computed(() => {
    const data = this.readings();
    if (data.length === 0) return [];
    const values = data.map((r) => r.value);
    const minVal = Math.min(...values, this.threshold() ?? Infinity);
    const maxVal = Math.max(...values, this.threshold() ?? -Infinity);
    const range = maxVal - minVal || 1;
    const innerH = this.height - this.padding * 2;
    const ticks = 4;
    return Array.from({ length: ticks + 1 }, (_, i) => {
      const value = minVal + (range * i) / ticks;
      const y = this.height - this.padding - ((value - minVal) / range) * innerH;
      return { value: +value.toFixed(2), y };
    });
  });

  readonly thresholdY = computed(() => {
    const t = this.threshold();
    if (t === null) return null;
    const data = this.readings();
    if (data.length === 0) return null;
    const values = data.map((r) => r.value);
    const minVal = Math.min(...values, t);
    const maxVal = Math.max(...values, t);
    const range = maxVal - minVal || 1;
    const innerH = this.height - this.padding * 2;
    return this.height - this.padding - ((t - minVal) / range) * innerH;
  });

  readonly xLabels = computed(() => {
    const data = this.readings();
    if (data.length === 0) return [];
    const times = data.map((r) => new Date(r.recordedAt).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;
    const innerW = this.width - this.padding * 2;
    const labels: { index: number; percent: number; text: string }[] = [];
    const step = Math.max(1, Math.floor(data.length / 4));
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const percent = ((new Date(r.recordedAt).getTime() - minTime) / timeRange) * 100;
      labels.push({ index: i, percent, text: new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    }
    if (labels[labels.length - 1]?.index !== data.length - 1) {
      const last = data[data.length - 1];
      labels.push({ index: data.length - 1, percent: 100, text: new Date(last.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    }
    return labels;
  });

  pointAt(index: number) {
    return this.points()[index];
  }

  onMove(event: MouseEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.width;
    const pts = this.points();
    if (pts.length === 0) return;
    let closest = 0;
    let minDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < minDist) { minDist = d; closest = i; }
    });
    this.hovered.set(closest);
  }
}