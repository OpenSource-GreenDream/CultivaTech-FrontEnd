import {ReviewResource} from './review.response';
import {Review, ReviewTargetType} from '../domain/model/review.entity';

/**
 * Assembler to transform Review resources and entities.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class ReviewAssembler {
  static toEntityFromResource(resource: ReviewResource): Review {
    let targetType: ReviewTargetType = resource.target_type ?? 'FIELD';
    if (!resource.target_type) {
      if (resource.product_id) {
        targetType = 'PRODUCT';
      } else if (resource.field_id) {
        targetType = 'FIELD';
      }
    }

    return new Review(
      resource.id,
      resource.author_profile_id,
      resource.target_profile_id,
      resource.content,
      Number(resource.rating),
      targetType,
      resource.field_id ?? null,
      resource.product_id ?? null
    );
  }

  static toResourceFromEntity(entity: Review): ReviewResource {
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      author_profile_id: entity.authorProfileId,
      target_profile_id: entity.targetProfileId,
      target_type: entity.targetType,
      field_id: entity.fieldId,
      product_id: entity.productId,
      content: entity.content,
      rating: entity.rating,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
