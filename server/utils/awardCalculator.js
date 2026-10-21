// Allocation policy whic determines how much a student is allocate based on the application matrixs
const calculateProposedAward = (score) => {
  if (score >= 70) return 20000;
  if (score >= 50) return 15000;
  if (score >= 30) return 10000;
  return 5000;
};

module.exports = calculateProposedAward;