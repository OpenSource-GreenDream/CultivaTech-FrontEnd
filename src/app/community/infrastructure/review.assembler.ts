import {ReviewResource} from './review.response';
import {Review} from '../domain/model/review.entity';

/**
 * Assembler to transform Review resources and entities.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class ReviewAssembler {
  static toEntityFromResource(resource: ReviewResource): Review {
    return new Review(
      resource.id,
      resource.author_profile_id,
      resource.target_profile_id,
      resource.content,
      resource.rating
    );
  }

  static toResourceFromEntity(entity: Review): ReviewResource {
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      author_profile_id: entity.authorProfileId,
      target_profile_id: entity.targetProfileId,
      content: entity.content,
      rating: entity.rating,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
