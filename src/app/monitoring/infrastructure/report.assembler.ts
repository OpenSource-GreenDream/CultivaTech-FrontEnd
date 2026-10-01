import { Report } from '../domain/model/report.entity';
import { ReportResource } from './report-resource';

export class ReportAssembler {
  static toEntityFromResource(resource: ReportResource): Report {
    return new Report(
      resource.id,
      resource.device_id,
      resource.generated_at,
      resource.mean_value,
      resource.variance,
      resource.standard_deviation,
      resource.technical_interpretation,
    );
  }
}
