export class Report {
  constructor(
    public id: number,
    public deviceId: number,
    public generatedAt: string,
    public meanValue: number,
    public variance: number,
    public standardDeviation: number,
    public technicalInterpretation: string,
  ) {}
}
