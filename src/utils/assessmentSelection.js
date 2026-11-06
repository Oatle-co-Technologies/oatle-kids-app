export function shuffleAssessment(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Keep skill coverage balanced, prefer questions not used on the last attempt,
// then mix skills so the child cannot learn a fixed answer sequence.
export function selectAssessment(pool, skills, perSkill, previousIds = [], random = Math.random) {
  const previous = new Set(previousIds);
  const selected = skills.flatMap(({ id }) => {
    const unique = [...new Map(pool.filter(q => q.skill === id).map(q => [q.assessmentId, q])).values()];
    const fresh = shuffleAssessment(unique.filter(q => !previous.has(q.assessmentId)), random);
    const repeated = shuffleAssessment(unique.filter(q => previous.has(q.assessmentId)), random);
    return [...fresh, ...repeated].slice(0, perSkill);
  });
  return shuffleAssessment(selected, random);
}

export function restoreAssessmentQuestions(ids, pool) {
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return [];
  const map = new Map(pool.map(q => [q.assessmentId, q]));
  const questions = ids.map(id => map.get(id));
  return questions.every(Boolean) ? questions : [];
}

export function assessmentResults(skills, answers) {
  return Object.fromEntries(skills.map(({ id }) => {
    const skillAnswers = answers.filter(answer => answer.skill === id);
    return [id, { total: skillAnswers.length, correct: skillAnswers.filter(answer => answer.correct).length }];
  }));
}
