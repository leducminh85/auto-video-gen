const SHOTS = {
  wide: 'Wide establishing view: the setting and relationship between people carry the idea; no presenter pointing at a board.',
  'close-up': 'Close-up of the one relevant object or physical action, enlarged for clarity; omit the full room and unnecessary people.',
  medium: 'Medium interaction view: show the actual exchange or action between people, not a presenter facing the viewer.',
  diagram: 'Top-down arrangement of only the relevant objects, with a clear reading order and generous empty space; no decorative charts.',
};

const INTENTS = [
  ['comparison', /compared|whereas|versus|unlike|so với|ngược lại|trái lại/i],
  ['process', /steps|workflow|first.*then|quy trình|các bước|sau đó/i],
  ['cause_effect', /because|therefore|leads to|causes|bởi vì|dẫn đến|do đó/i],
  ['change', /increase|decrease|transform|changes|tăng|giảm|biến đổi/i],
  ['detail', /for example|such as|ví dụ|chẳng hạn/i],
];

const DIRECTIONS = {
  comparison: 'Show the contrast actually stated in the narration; do not invent opposing outcomes.',
  process: 'Show the narrated stage of the process using only the stated participants and objects.',
  cause_effect: 'Make the stated cause and its consequence visually connected; do not add unsupported effects.',
  change: 'Show the specific change described by the narration; avoid invented statistics.',
  detail: 'Focus on the concrete example named in this beat, leaving unrelated context out.',
  explanation: 'Depict the specific subject, action or relationship in this beat; do not substitute a generic presenter.',
};

function detectIntent(text) {
  return INTENTS.find(([, pattern]) => pattern.test(text || ''))?.[0];
}

function chooseShot(intent, history = []) {
  const choices = {
    comparison: ['wide', 'diagram', 'close-up'], process: ['diagram', 'medium', 'close-up'],
    cause_effect: ['wide', 'diagram', 'medium'], change: ['medium', 'close-up', 'wide'],
    detail: ['close-up', 'diagram', 'medium'],
  }[intent] || ['wide', 'close-up', 'medium', 'diagram'];
  const recent = history.slice(-3);
  return choices.find(shot => !recent.some(p => p.shotType === shot))
    || choices.find(shot => shot !== history.at(-1)?.shotType) || choices[0];
}

function localDirection({ beatText, sceneText, domain, history = [] }) {
  const intent = detectIntent(beatText) || 'explanation';
  const objects = [];
  const action = `Illustrate this exact narration: "${beatText}". ${DIRECTIONS[intent]}`;
  const shotType = chooseShot(intent, history);
  return {
    intent,
    meaning: beatText,
    what_to_show: action,
    action,
    subject: domain.topic,
    objects,
    environment: domain.environment,
    shotType,
    visualMethod: intent === 'comparison' ? 'comparison' : intent === 'process' ? 'process'
      : shotType === 'wide' ? 'environment' : shotType === 'close-up' ? 'object_metaphor' : 'character_action',
    keyText: '',
    how_to_show: SHOTS[shotType],
    composition: SHOTS[shotType],
    mustNotInclude: ['unrelated props', 'invented statistics', 'generic presenter board'],
    transitionIntent: history.length ? 'Advance the narrated idea with a different focal action and framing.' : 'Establish the subject.',
    planningSource: 'local',
  };
}

function finalizeDirection(plan, history, buildPrompt) {
  const intent = plan.intent || detectIntent(plan.meaning) || 'explanation';
  const shotType = plan.shotType === history.at(-1)?.shotType
    ? chooseShot(intent, history) : plan.shotType || chooseShot(intent, history);
  const framing = shotType === plan.shotType && plan.planningSource === 'ai'
    ? `${SHOTS[shotType] || ''} ${plan.how_to_show || ''}` : SHOTS[shotType] || plan.how_to_show || '';
  const next = { ...plan, intent, shotType, composition: framing, how_to_show: framing };
  next.imageGenerationPrompt = buildPrompt({
    actionDescription: `${next.what_to_show || next.action}. Context: ${next.subject || ''}. Setting: ${next.environment || 'only the relevant context'}. ${framing} Only include these relevant props: ${(next.objects || []).join(', ') || 'those required by the action'}. Narration to illustrate faithfully: "${next.meaning}". The narration takes precedence over illustrative suggestions; omit unsupported services, quantities and outcomes. Preserve the same character proportions and black line weight across the video`,
    keyText: next.keyText,
    accentColor: 'amber orange',
  });
  return next;
}

function repeatedSubject(plan, history) {
  const tokens = value => new Set(String(value || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
  const current = tokens(plan.what_to_show || plan.action);
  if (!current.size) return true;
  return history.slice(-4).some(previous => {
    const other = tokens(previous.what_to_show || previous.action);
    const common = [...current].filter(word => other.has(word)).length;
    return common / new Set([...current, ...other]).size > 0.8;
  });
}

module.exports = { localDirection, finalizeDirection, repeatedSubject };
