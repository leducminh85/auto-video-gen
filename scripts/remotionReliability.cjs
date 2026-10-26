async function retryPart(task, { attempts = 4, onRetry = () => {}, onError = () => {} } = {}) {
  let last;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await task(attempt); }
    catch (error) {
      last = error;
      await onError(error, attempt);
      if (error.retryExhausted) break;
      if (attempt < attempts) await onRetry(attempt + 1, attempts);
    }
  }
  throw last;
}

function spreadTiming(weights, total, candidates = [], minimum = 1) {
  if (!weights.length || !Number.isFinite(total) || total < weights.length) throw new Error('Không đủ thời lượng để dựng các shot.');
  const sum = weights.reduce((n,w) => n + Math.max(1, w), 0);
  const spacing = Math.max(1, Math.min(minimum, Math.floor(total / weights.length)));
  let cumulative = 0, previous = 0;
  return weights.map((weight,i) => {
    const proportional = Math.round(cumulative / sum * total);
    cumulative += Math.max(1, weight);
    const valid = Number.isFinite(candidates[i]) && candidates[i] >= previous + spacing && candidates[i] <= total - (weights.length-i)*spacing;
    const proposed = valid ? Math.round(candidates[i]) : proportional;
    const start = i === 0 ? 0 : Math.max(previous + spacing, Math.min(total - (weights.length-i)*spacing, proposed));
    previous = start;
    return start;
  });
}

function publicGenerationError(error) {
  const message = String(error?.message || error || '');
  if (/^Đã dừng/.test(message)) return 'Đã dừng tác vụ. Bấm Tiếp tục dựng để làm phần còn thiếu; các cảnh đã đạt được giữ lại.';
  if (/Ảnh kiểm duyệt chưa tải lên|ChatGPT chưa nhận được ảnh/.test(message)) return 'Chưa gửi được ảnh kiểm duyệt lên ChatGPT sau các lượt thử. Các cảnh đã đạt được giữ lại; bấm Tiếp tục dựng để gửi lại ảnh.';
  if(error?.code==='VISUAL_QUALITY')return `Cảnh ${error.sceneNumber||''} chưa đạt kiểm duyệt hình ảnh sau các lượt sửa. Phản hồi đã được nhận; các cảnh đã đạt được giữ lại.`;
  if (error?.issues?.length) {
    const fields=[...new Set(error.issues.map(issue=>String(issue.path||'').split('/').filter(Boolean).at(-1)).filter(Boolean))].slice(0,3);
    return `Đã nhận phản hồi ChatGPT nhưng cảnh chưa đạt kiểm tra${fields.length ? ` (${fields.join(', ')})` : ''}. Các cảnh đã đạt được giữ lại; bấm Tiếp tục dựng để thử tiếp.`;
  }
  if (Number.isInteger(error?.sceneNumber) && Number.isInteger(error?.shotNumber)) return `Cảnh ${error.sceneNumber}, shot ${error.shotNumber} chưa hoàn tất sau các lượt sửa. Bấm tạo lại với cùng đầu vào để tiếp tục; các shot đã đạt được giữ nguyên.`;
  if (/đăng nhập|login|authenticated|cookie/i.test(message)) return 'Chưa kết nối được ChatGPT sau các lượt thử. Hãy kiểm tra đăng nhập rồi thử lại.';
  if (/retry|tự tối ưu|storyboard|thiết kế|JSON|validation/i.test(message)) return 'Chưa hoàn tất cảnh sau các lượt thử. Các phần đã dựng được giữ lại để tiếp tục.';
  return 'Chưa hoàn tất video sau các lượt thử. Các phần đã dựng được giữ lại; chi tiết đã lưu trong nhật ký.';
}
module.exports = { retryPart, spreadTiming, publicGenerationError };
