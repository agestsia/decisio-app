/**
 * Weighted Sum Model (WSM) Engine
 * Input:
 *  - criteria: [{ id, weight }]
 *  - alternatives: [{ id }]
 *  - scores: [{ alternativeId, criterionId, value }]
 * Output:
 *  - [{ alternativeId, totalScore }]
 */

function computeWSM({ criteria, alternatives, scores }) {
  const results = [];

  for (const alt of alternatives) {
    let totalScore = 0;

    for (const crit of criteria) {
      const score = scores.find(
        (s) =>
          s.alternativeId === alt.id &&
          s.criterionId === crit.id
      );

      if (!score) {
        throw new Error(
          `Score missing for alternative ${alt.id} and criterion ${crit.id}`
        );
      }

      totalScore += Number(score.value) * Number(crit.weight);
    }

    results.push({
      alternativeId: alt.id,
      totalScore,
    });
  }

  // sort descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results;
}

module.exports = {
  computeWSM,
};
