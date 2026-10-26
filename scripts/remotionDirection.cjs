const { ChatGPTBrowser, parseJSON } = require('./chatgptBrowser.cjs');
const { STYLE, compactContext, compactBoard, briefIssues } = require('./remotionPrompts.cjs');
const request = async prompt => parseJSON(await ChatGPTBrowser.getInstance().request(prompt));
const { retryPart, spreadTiming } = require('./remotionReliability.cjs');
const roles = ['hook', 'context', 'evidence', 'mechanism', 'data', 'consequence', 'reaction'];

function normalizeBoard(board, wordCount) {
  if (!Array.isArray(board?.shots) || !board.shots.length) return board;
  const shots = board.shots.slice(0, wordCount);
  const starts = spreadTiming(shots.map(shot => Math.max(1, (Number(shot.endWord) || 0) - (Number(shot.startWord) || 0))), wordCount, shots.map(shot => Number.isFinite(Number(shot.startWord)) ? Number(shot.startWord) : undefined));
  return { ...board, shots: shots.map((shot,i) => {
    const endWord = starts[i+1] ?? wordCount;
    const events = Array.isArray(shot.events) ? shot.events : [];
    return { ...shot, startWord: starts[i], endWord, events: events.map(event => ({ ...event, word: Math.max(starts[i], Math.min(endWord-1, Math.round(Number(event.word) || starts[i]))) })).sort((a,b) => a.word-b.word) };
  }) };
}

function validateBoard(board, wordCount) {
  if (!Array.isArray(board.shots) || !board.shots.length || board.shots.length > 24) throw new Error('Storyboard cần 1..24 shot.');
  let cursor = 0;
  for (const shot of board.shots) {
    if (shot.startWord !== cursor || !Number.isInteger(shot.endWord) || shot.endWord <= cursor || shot.endWord > wordCount) throw new Error('Storyboard thiếu hoặc trùng lời.');
    if (!roles.includes(shot.role)) throw new Error('Shot thiếu chức năng hình ảnh.');
    for (const field of ['framing', 'focalSubject', 'visualMeaning', 'action', 'incomingState', 'outgoingState']) {
      if (typeof shot[field] !== 'string' || !shot[field].trim()) throw new Error(`Shot thiếu ${field}.`);
    }
    if (!Array.isArray(shot.events) || !shot.events.length) throw new Error('Shot thiếu mốc hành động.');
    let previous = shot.startWord;
    for (const event of shot.events) {
      if (!Number.isInteger(event.word) || event.word < previous || event.word >= shot.endWord || typeof event.action !== 'string' || !event.action.trim()) throw new Error(`Mốc hành động phải tăng không giảm trong ${shot.startWord}..${shot.endWord-1}, dùng chỉ số WORDS toàn cảnh. Nhận ${JSON.stringify(event)}.`);
      previous = event.word;
    }
    cursor = shot.endWord;
  }
  if (cursor !== wordCount) throw new Error('Storyboard chưa phủ hết lời.');
  return board;
}

async function directScene(input, ask = request, options = {}) {
  const words = input.text.trim().split(/\s+/u);
  let prompt = `Plan ONE continuous shot for this entire narrated scene. Return JSON only.
${STYLE}
${input.userApproved ? 'The user approved the supplied direction, composition and action chain. Preserve their choices; only expand implementation details. Do not invent another concept or location.' : ''}
Each shot: one focal subject, visual meaning, concrete action and consistent incoming/outgoing state. Keep one location; camera may follow the approved action. Use 3–5 sequential action events within this shot: anticipation, contact, result, reaction. No internal cuts, inserts, replacement sets or isolated reaction shots. ${input.firstScene ? 'Opening: show a curious visual in the first 3 seconds.' : 'Continue the existing story; no new hook required.'}
JSON:{"shots":[{"startWord":0,"role":"context","framing":"wide","focalSubject":"...","visualMeaning":"...","action":"prepare,contact,result,hold","incomingState":"...","outgoingState":"...","events":[{"word":0,"action":"..."}]}]}
Roles:${roles.join(',')}. Only startWord is needed: first=0, later starts increase; server fills endings and fits audio. event.word uses scene-wide WORDS indices. Timing is approximate. Return exactly one shot spanning all words; no decorative motion or extra facts.
CONTEXT:${JSON.stringify(compactContext(input))}
WORDS:${words.map((w,i)=>`${i}:${w}`).join(' ')}`;
  const basePrompt = prompt;
  const maxAttempts = options.maxAttempts ?? 8;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new Error('Số lượt tối ưu storyboard phải trong 1..20.');
  const safeAsk = prompt => retryPart(() => ask(prompt), { attempts: 4, onRetry: (attempt, maxAttempts) => options.onProgress?.({ attempt, maxAttempts, phase: 'retry' }), onError: (error, attempt) => options.onDiagnostic?.({ attempt, error: error.message }) });
  let previousBoard;
  let retainedBoard;
  let repairIndices;
  const resume = options.resumeRevision;
  if (resume?.board && Array.isArray(resume.review?.shotIssues) && resume.review.shotIssues.length && resume.review.shotIssues.every(item => Number.isInteger(item.shotIndex) && item.shotIndex >= 0 && item.shotIndex < resume.board.shots?.length)) {
    retainedBoard = resume.board;
    repairIndices = new Set(resume.review.shotIssues.map(item => item.shotIndex));
    prompt = `${basePrompt}\nContinue from this saved board. Repair only shot indices ${[...repairIndices].join(',')}; preserve all other shots and the shot count.\nBOARD:${JSON.stringify(compactBoard(retainedBoard))}\nCORRECTIONS:${JSON.stringify(briefIssues(resume.review.issues))}`;
  }
  const history = [];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    options.onProgress?.({ attempt: attempt + 1, maxAttempts, phase: attempt ? 'repair' : 'design' });
    previousBoard = await safeAsk(prompt);
    if (retainedBoard && Array.isArray(previousBoard?.shots) && previousBoard.shots.length === retainedBoard.shots.length) {
      previousBoard.shots = previousBoard.shots.map((shot,i) => repairIndices.has(i) ? shot : retainedBoard.shots[i]);
    }
    let board;
    try {
      board = validateBoard(normalizeBoard(previousBoard, words.length), words.length);
      if (board.shots.length !== (options.resumeRevision?.board?.shots?.length || 1)) { board = undefined; throw new Error("Combine all actions into ONE continuous shot with timed events; keep the location and composition stable."); }
    } catch (error) {
      history.push({ attempt: attempt + 1, board: previousBoard, review: { passed: false, issues: [error.message] } });
    }
    if (board) {
      options.onProgress?.({ attempt: attempt + 1, maxAttempts, phase: 'review' });
      const review = await safeAsk(`Review this storyboard. Return JSON only: {"passed":true,"issues":[],"shotIssues":[]}; if blocked, use passed:false and at most 3 short issues with {"shotIndex":0,"issue":"specific fix"}.
${STYLE}
Require one continuous composition with sequential actions, no internal cuts. Block only concrete unreadability, unsupported facts, broken continuity or missing meaningful action. Timing drift, imperfect word indices and taste are not blockers. Keep approved shots. ${input.firstScene ? 'Opening: curious visual within 3 seconds.' : 'NOT the opening scene: do not demand another hook.'} Review the plan, not imaginary pixel defects.
NARRATION:${input.text}
CONTEXT:${JSON.stringify(compactContext(input))}
BOARD:${JSON.stringify(compactBoard(board))}`);

      if (typeof review?.passed !== 'boolean' || !Array.isArray(review.issues) || review.issues.some(issue => typeof issue !== 'string')) {
        history.push({ attempt: attempt + 1, board, review: { passed: false, issues: ['Review response must contain boolean passed and string-array issues.'] } });
      } else {
        history.push({ attempt: attempt + 1, board, review });
        if (Array.isArray(review.shotIssues) && review.shotIssues.length && review.shotIssues.every(item => Number.isInteger(item.shotIndex) && item.shotIndex >= 0 && item.shotIndex < board.shots.length)) { retainedBoard = board; repairIndices = new Set(review.shotIssues.map(item => item.shotIndex)); }
        await options.onAttempt?.(history[history.length - 1]);
        if (review.passed && review.issues.length === 0) return { ...board, review, revision_count: attempt, review_history: history };
      }
    }
    if (!board || history[history.length - 1].review.issues[0]?.startsWith('Review response')) await options.onAttempt?.(history[history.length - 1]);
    const latest = history[history.length - 1];
    prompt = `FIX THESE ITEMS FIRST:${JSON.stringify(briefIssues(latest.review.issues))}\n${basePrompt}\nRepair ONLY the affected shots. Keep acceptable shots, their indices, continuity and visual ideas unchanged. Do not rebuild the whole scene. ${repairIndices ? `Only shot indices ${[...repairIndices].join(',')} may change; preserve the shot count.` : ''} Preserve source narration and valid continuity. Do not answer with criticism or explanations: return a complete replacement storyboard JSON.\nPREVIOUS BOARD:${JSON.stringify(compactBoard(latest.board))}\nREQUIRED CORRECTIONS:${JSON.stringify(briefIssues(latest.review.issues))}`;
  }
  const error = new Error(`Storyboard chưa đạt sau ${maxAttempts} lượt tự tối ưu. Các bản sửa đã được lưu để tiếp tục; không xuất bản kế hoạch chưa đạt.`);
  error.retryExhausted = true;
  error.code = 'STORYBOARD_REPAIR_EXHAUSTED';
  error.reviewHistory = history;
  throw error;
}

function timedBoard(board, timing, frames, fps = 60) {
  const starts = spreadTiming(board.shots.map(shot => shot.endWord - shot.startWord), frames, board.shots.map((_,i) => Number.isFinite(timing?.[i]?.start) ? timing[i].start * fps : undefined), Math.round(fps * .5));
  return board.shots.map((shot,i)=>({...shot, start_frame_offset: starts[i], duration_in_frames:(starts[i+1] ?? frames)-starts[i]}));
}
module.exports = { directScene, validateBoard, normalizeBoard, timedBoard };
