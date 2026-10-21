
const calculateScore = (vulnerabilityMetrics) => {
  let score = 0;

  const {
    familyStatus,
    householdIncomeBracket,
    disabledParents = false,
    chronicIllnessInFamily = false,
    siblingsInSchool = 0
  } = vulnerabilityMetrics;

  // Family status points
  if (familyStatus === 'total-orphan') {
    score += 40;
  } else if (familyStatus === 'partial-orphan-single-parent') {
    score += 25;
  } else if (familyStatus === 'both-parents-alive') {
    score += 10;
  }

  // Household income points
  if (householdIncomeBracket === 'under-10k') {
    score += 30;
  } else if (householdIncomeBracket === '10k-30k') {
    score += 15;
  } else if (householdIncomeBracket === 'above-30k') {
    score += 5;
  }

  // Additional vulnerability points
  if (disabledParents) {
    score += 10;
  }

  if (chronicIllnessInFamily) {
    score += 10;
  }

  // Maximum of 10 points for siblings in school
  score += Math.min(siblingsInSchool * 2, 10);

  return score;
};

module.exports = calculateScore;
