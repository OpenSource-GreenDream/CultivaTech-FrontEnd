import { Field } from '../domain/model/field.entity';
import { FieldResource } from './field-resource';

export class FieldAssembler {
  static toEntityFromResource(resource: FieldResource): Field {
    return new Field(resource.id, resource.name);
  }
}
