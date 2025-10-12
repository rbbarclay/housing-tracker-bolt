import { Property, Criterion, Rating, PropertyScore } from '../types';

export function calculatePropertyScore(
  property: Property,
  ratings: Rating[],
  criteria: Criterion[]
): PropertyScore {
  const mustHaveCriteria = criteria.filter(c => c.type === 'must-have');
  const niceToHaveCriteria = criteria.filter(c => c.type === 'nice-to-have');

  const mustHaveRatings = ratings.filter(r =>
    mustHaveCriteria.some(c => c.id === r.criterion_id)
  );
  const niceToHaveRatings = ratings.filter(r =>
    niceToHaveCriteria.some(c => c.id === r.criterion_id)
  );

  const mustHaveScore = mustHaveRatings.length > 0
    ? mustHaveRatings.reduce((sum, r) => sum + r.score, 0) / mustHaveRatings.length
    : 0;

  const niceToHaveScore = niceToHaveRatings.length > 0
    ? niceToHaveRatings.reduce((sum, r) => sum + r.score, 0) / niceToHaveRatings.length
    : 0;

  const totalScore = (mustHaveScore * 3) + (niceToHaveScore * 1);

  const meetsAllMustHaves = mustHaveCriteria.length > 0 &&
    mustHaveRatings.length === mustHaveCriteria.length &&
    mustHaveRatings.every(r => r.score === 3);

  return {
    property,
    mustHaveScore,
    niceToHaveScore,
    totalScore,
    meetsAllMustHaves,
    ratings
  };
}

export function sortPropertiesByScore(scores: PropertyScore[]): PropertyScore[] {
  return [...scores].sort((a, b) => b.totalScore - a.totalScore);
}

export function filterTier1Properties(scores: PropertyScore[]): PropertyScore[] {
  return scores
    .filter(s => s.meetsAllMustHaves)
    .sort((a, b) => b.niceToHaveScore - a.niceToHaveScore);
}

export function sortPropertiesByCriterion(
  scores: PropertyScore[],
  criterionId: string
): PropertyScore[] {
  return [...scores].sort((a, b) => {
    const aRating = a.ratings.find(r => r.criterion_id === criterionId);
    const bRating = b.ratings.find(r => r.criterion_id === criterionId);
    const aScore = aRating?.score || 0;
    const bScore = bRating?.score || 0;

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return b.totalScore - a.totalScore;
  });
}
