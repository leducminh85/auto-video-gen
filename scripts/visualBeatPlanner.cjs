const fs = require('fs');
const path = require('path');

/**
 * Global Video Style Guide
 * Enforces uniform visual direction, character proportions, color palette, and stroke weights.
 */
function createVideoStyleGuide(title = '', tone = 'explainer') {
  return {
    characterStyle: 'minimalist_vector_stickman',
    strokeWidth: 7,
    palette: {
      background: '#FDFBF7',      // Warm cream paper
      bgAccent: '#F3EFE6',        // Subtle contrast
      card: '#FFFFFF',            // Crisp card surface
      outline: '#1E293B',         // Deep slate outline
      primary: '#2563EB',         // Royal blue
      secondary: '#10B981',       // Emerald growth
      accent: '#F59E0B',          // Amber warm focus
      danger: '#EF4444',          // Coral red alert
      purple: '#8B5CF6',          // Modern violet
      muted: '#64748B',           // Muted slate
      highlight: '#FEF3C7',       // Soft gold glow
    },
    typography: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
    levelOfDetail: 'focused',
  };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Semantic Concept & Keyword Extractor
 * Identifies exact numbers, metrics, objects, actions, and topics with full scene context awareness.
 */
function extractSemanticConcepts(text, sceneContext = {}) {
  const clean = (text || '').trim();
  const lower = clean.toLowerCase();
  const sceneTitleStr = (sceneContext.sceneTitle || '').toLowerCase();
  const sceneTextStr = (sceneContext.sceneText || '').toLowerCase();
  const sceneStr = `${lower} ${sceneTitleStr} ${sceneTextStr}`.trim();
  const contextStr = `${sceneStr} ${(sceneContext.videoTitle || '').toLowerCase()}`;

  // Metrics & Numbers
  const percentMatch = clean.match(/(\d+(?:[.,]\d+)?\s*%)/i) || contextStr.match(/(\d+(?:[.,]\d+)?\s*%)/i);
  const moneyMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:nghìn|triệu|tỷ|k|đồng|đ|usd|\$))/i);
  const timeMatch = clean.match(/(\d+(?:[.,]\d+)?\s*(?:giây|phút|tiếng|giờ|ngày|tháng|năm))/i);

  const percentage = percentMatch ? percentMatch[0].replace(/\s+/g, '') : null;
  const money = moneyMatch ? moneyMatch[0] : null;
  const time = timeMatch ? timeMatch[0] : null;

  // Global Domain Check - STRICTLY anchored on the current scene content, never poisoned by stale video title!
  const isGymDomain = /gym|phòng tập|thể hình|máy chạy bộ|cử tạ|tạ tay|huấn luyện thể|hội viên tập|thẻ tập gym/i.test(sceneStr);
  const isCoffeeDomain = /cà phê|coffee|espresso|take-away|mang đi|hạt cà phê|quán cà phê|takeaway|barista/i.test(sceneStr);
  const isCookingDomain = /nấu|nước dùng|món ăn|ẩm thực|công thức|phở|bếp|nướng|luộc|gia vị|thịt|cá|nước mắm|thảo mộc|hầm|nêm nếm/i.test(sceneStr);
  const isTechDomain = /lập trình|code|developer|phần mềm|ai|trí tuệ nhân tạo|thuật toán|dữ liệu|máy tính|app|web|database|javascript|python/i.test(sceneStr);
  const isEducationDomain = /học tập|sinh viên|trường học|sách|kiến thức|kỹ năng|ôn thi|bài giảng|đọc sách|giáo dục/i.test(sceneStr);

  // Exact Concept Triggers - STRICTLY GUARDED by domain
  const isGymRushHour = isGymDomain && /máy chạy bộ|quầy lễ tân|kín người|xếp hàng/i.test(lower);
  const isGymEntrance = isGymDomain && /đến phòng gym|bước vào|giờ cao điểm|ảo tưởng/i.test(lower) && !isGymRushHour;
  const isCashMachineDelusion = isGymDomain && /cỗ máy in tiền|in tiền|béo bở/i.test(lower);
  const isCapacityParadox = isGymDomain && /nghịch lý sức chứa|7 ngàn|200 người|chỉ chứa nổi/i.test(lower);
  const isRealityQuestion = isGymDomain && /bản chất thực sự|sự thật đằng sau/i.test(lower);

  const isGymCost300k1M = isGymDomain && /300 ngàn|1 triệu|chi phí mở cửa|tốn kém|đầu tư ban đầu/i.test(lower);
  const isCashDrain = isGymDomain && /mua đứt|ngốn sạch|dòng tiền dự phòng|kiệt quệ|cạn kiệt/i.test(lower);
  const isDebtLeasing = isGymDomain && /thuê tài chính|lãi suất|nợ cố định|nợ|gánh nặng/i.test(lower);

  const isMachineWear = isGymDomain && /làm mòn máy móc|chăm chỉ|hao mòn/i.test(lower);
  const isGhostIntro = isGymDomain && (/bí mật lợi nhuận|hội viên vô hình/i.test(lower)) && !/100%|lặn mất tăm/i.test(lower);
  const isGhostMemberSecret = isGymDomain && /lặn mất tăm|100% lợi nhuận|100%|đóng tiền rồi lặn/i.test(lower);
  const isJanuaryWave = isGymDomain && /cú lừa tháng một|tháng một|tháng 1|đăng ký ồ ạt|12%/i.test(lower);
  const isDropoff80 = isGymDomain && /80% sẽ bỏ cuộc|bỏ cuộc|trước mùa hè|bỏ tập|nghỉ tập/i.test(lower);

  const isContractTrap = isGymDomain && /rào cản hủy|hợp đồng|bản quyền âm nhạc|tinh quái|khó hủy/i.test(lower);
  const isAirConditioningBill = isGymDomain && /máy lạnh|tiền điện|24\/7|bào mòn túi tiền/i.test(lower);

  const isSmallGroupPT = isGymDomain && /huấn luyện|nhóm nhỏ|4 người|vũ khí tối ưu|pt\b|huấn luyện viên/i.test(lower);
  const isSurvivalRule = isGymDomain && /sống sót dựa trên|không bao giờ đến tập/i.test(lower);

  // Coffee Triggers - STRICTLY GUARDED by domain
  const isCoffeePrice = isCoffeeDomain && /50\.000|3\.000|giá|chi phí hạt|nguyên liệu/i.test(lower);
  const isCoffeeSpeed = isCoffeeDomain && /60 giây|tốc độ|quay vòng|nhanh|chớp nhoáng|take-away/i.test(lower);
  const isLaptopSitting6h = isCoffeeDomain && /laptop|cắm sạc|ngồi suốt 6 tiếng|ngồi 6 tiếng/i.test(lower);
  const isCoffeeStorefront = isCoffeeDomain && /mặt bằng|đắc địa|máy pha espresso|khấu hao/i.test(lower);

  // General Concept Triggers (Work dynamically across any domain)
  const isDopamineOrShopping = /dopamine|mua hàng|bấm nút|giỏ hàng|sung sướng|phấn khích|tiêu sài|tiêu tiền|mua sắm/i.test(lower);
  const isCompoundingOrWealth = /lãi kép|tích lũy|warren buffett|đầu tư|tài sản|cấp số nhân|tự do tài chính|tuổi 50/i.test(lower);
  const isAllocationRule = /50\s*\/\s*30\s*\/\s*20|quy tắc|phân bổ|hũ|ngân sách|chi tiêu|tiết kiệm/i.test(lower);
  const isTechOrCode = /\blập trình\b|\bviết code\b|\bthuật toán\b|\bmã nguồn\b|\bpython\b|\bjavascript\b|\bdeveloper\b|\bsoftware code\b/i.test(lower);
  const isComparison = /thay vì|so với|chênh lệch|khác biệt|chứ không|ngược lại|đối lập|nhầm lẫn/i.test(lower);
  const isConclusionOrWisdom = /nguyên tắc vàng|bài học cốt lõi|chìa khóa thành công|kết luận|tóm lại/i.test(lower);

  return {
    percentage,
    money,
    time,
    isGymDomain,
    isGymEntrance,
    isGymRushHour,
    isCashMachineDelusion,
    isCapacityParadox,
    isMachineWear,
    isGhostIntro,
    isGhostMemberSecret,
    isRealityQuestion,
    isGymCost300k1M,
    isCashDrain,
    isDebtLeasing,
    isJanuaryWave,
    isDropoff80,
    isContractTrap,
    isAirConditioningBill,
    isSmallGroupPT,
    isSurvivalRule,
    isCoffeeDomain,
    isCoffeePrice,
    isCoffeeSpeed,
    isLaptopSitting6h,
    isCoffeeStorefront,
    isCookingDomain,
    isTechDomain,
    isEducationDomain,
    isDopamineOrShopping,
    isCompoundingOrWealth,
    isAllocationRule,
    isTechOrCode,
    isComparison,
    isConclusionOrWisdom,
  };
}

/**
 * Distribute an array of clauses into N balanced buckets
 */
function distributeIntoBuckets(items, bucketCount) {
  const count = Math.min(bucketCount, items.length);
  const buckets = Array.from({ length: count }, () => []);
  const baseSize = Math.floor(items.length / count);
  let remainder = items.length % count;
  let idx = 0;

  for (let b = 0; b < count; b++) {
    const take = baseSize + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    buckets[b] = items.slice(idx, idx + take);
    idx += take;
  }
  return buckets.filter((b) => b.length > 0).map((b) => b.join(' '));
}

/**
 * Visual Beat Segmentation (Target 1.5s - 3.8s per beat, 2-4 beats per scene)
 */
function segmentSceneIntoBeats(scene, durationInSeconds, totalFrames) {
  const text = (scene.text || scene.narration || '').trim();

  let targetBeatCount = 2;
  if (durationInSeconds <= 3.8) {
    targetBeatCount = 2;
  } else if (durationInSeconds <= 7.0) {
    targetBeatCount = 3;
  } else {
    targetBeatCount = 4;
  }

  const masked = text.replace(/(\d)[.,](\d)/g, '$1___NUMSEP___$2');

  const rawClauses = masked
    .split(/(?<=[.!?;\n])\s+|(?<=[,])\s+|\s+(?:khiến chúng ta|thay vì|nhưng|mặc dù|trong khi|bởi vì|dẫn đến|để rồi|ngược lại|chứ không|mà bị)\s+/i)
    .map((s) => s.replace(/___NUMSEP___/g, '.').trim())
    .filter((s) => s.length > 4);

  let parts = [];

  if (rawClauses.length >= targetBeatCount) {
    parts = distributeIntoBuckets(rawClauses, targetBeatCount);
  } else if (rawClauses.length > 1) {
    parts = rawClauses;
  } else {
    const words = text.split(/\s+/);
    if (words.length <= 10 || targetBeatCount === 1) {
      parts = [text];
    } else {
      const wordsPerBeat = Math.ceil(words.length / targetBeatCount);
      for (let i = 0; i < words.length; i += wordsPerBeat) {
        parts.push(words.slice(i, i + wordsPerBeat).join(' '));
      }
    }
  }

  // Refine any oversized part
  let refinedParts = [];
  const wordsTotal = parts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  for (const part of parts) {
    const wordCount = part.split(/\s+/).length;
    const estSec = (wordCount / wordsTotal) * durationInSeconds;
    if (estSec > 4.2 && wordCount >= 8) {
      const w = part.split(/\s+/);
      const half = Math.ceil(w.length / 2);
      refinedParts.push(w.slice(0, half).join(' '));
      refinedParts.push(w.slice(half).join(' '));
    } else {
      refinedParts.push(part);
    }
  }

  const finalTotalWords = refinedParts.reduce((acc, p) => acc + p.split(/\s+/).length, 0) || 1;
  let allocatedFrames = 0;

  return refinedParts.map((part, idx) => {
    const isLast = idx === refinedParts.length - 1;
    const wordsCount = part.split(/\s+/).length;
    let frames = Math.round(totalFrames * (wordsCount / finalTotalWords));

    if (isLast) {
      frames = totalFrames - allocatedFrames;
    }
    const startOffset = allocatedFrames;
    allocatedFrames += frames;
    const durSec = Number((frames / 30).toFixed(2));

    return {
      id: `scene_${scene.id}_beat_${idx + 1}`,
      sub_index: idx + 1,
      title: `${scene.title} - Beat ${idx + 1}`,
      text: part,
      caption: part,
      duration_in_seconds: durSec,
      duration_in_frames: frames,
      start_frame_offset: startOffset,
    };
  });
}

const BEAT_STOPWORDS = new Set([
  'chúng', 'ta', 'tôi', 'bạn', 'mọi', 'người', 'của', 'và', 'hoặc', 'nhưng', 'mà', 'thì', 'là',
  'rằng', 'ở', 'tại', 'với', 'cho', 'để', 'được', 'bị', 'do', 'bởi', 'khiến', 'làm', 'này',
  'đó', 'kia', 'những', 'các', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'ngày', 'nay', 'hiện',
  'tại', 'trong', 'ngoài', 'trên', 'dưới', 'rất', 'quá', 'lắm', 'luôn', 'sẽ', 'đang', 'đã',
  'cũng', 'chỉ', 'đều', 'vừa', 'mới', 'tự', 'ra', 'vào', 'lại', 'thấy', 'nghĩ', 'rõ', 'không',
  'chưa', 'chẳng', 'thế', 'nào', 'gì', 'sao'
]);

function extractDynamicKeyText(text, fallbackTitle) {
  if (!text) return (fallbackTitle || 'Ý CHÍNH').toUpperCase();

  // 1. Metric / Number / Percentage first
  const metricMatch = text.match(/(\d+(?:[.,]\d+)?\s*(?:%|triệu|tỷ|usd|đ|k|tiếng|giờ|phút|giây|tháng|năm|người|kg|members|\$))/i);
  if (metricMatch) {
    return metricMatch[0].trim().toUpperCase();
  }

  // 2. Strong keyword phrases in quotation marks
  const quoteMatch = text.match(/["'«“]([^"'»”]{2,20})["'»”]/);
  if (quoteMatch) {
    return quoteMatch[1].trim().toUpperCase();
  }

  // 3. Extract 2-3 content words
  const clean = text.replace(/[,.!?;:()"'«»“”\n\r]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const contentWords = words.filter((w) => !BEAT_STOPWORDS.has(w.toLowerCase()));

  if (contentWords.length >= 2) {
    return contentWords.slice(0, 3).join(' ').toUpperCase();
  } else if (contentWords.length === 1) {
    return contentWords[0].toUpperCase();
  }

  return (fallbackTitle || 'Ý CHÍNH').toUpperCase();
}

/**
 * Smart Content-Driven Visual Beat Planner with Scene Context
 */
function createLocalBeatPlan({ beatText, beatIndex, totalBeats, sceneTitle, sceneText, videoTitle, prevMethod }) {
  const clean = (beatText || '').trim();
  const c = extractSemanticConcepts(clean, { sceneTitle, sceneText, videoTitle });

  let visualMethod = 'character_action';
  let shotType = 'medium';
  let meaning = clean;
  let subject = 'Nhân vật và bối cảnh';
  let action = `Minh họa ý tưởng: ${clean.substring(0, 60)}...`;
  let keyText = extractDynamicKeyText(clean, sceneTitle);

  // 1. Gym-specific beats (ONLY when inside Gym domain)
  if (c.isGymDomain) {
    if (c.isGymEntrance) {
      visualMethod = 'environment';
      shotType = 'wide';
      keyText = 'BƯỚC VÀO PHÒNG GYM';
      action = 'Nhân vật mở cửa bước vào phòng gym lúc chập tối với biển hiệu rực sáng';
    } else if (c.isGymRushHour) {
      visualMethod = 'character_action';
      shotType = 'medium';
      keyText = 'GIỜ CAO ĐIỂM';
      action = 'Máy chạy bộ kín chỗ và dòng người xếp hàng tại quầy lễ tân';
    } else if (c.isCashMachineDelusion) {
      visualMethod = 'object_metaphor';
      shotType = 'medium';
      keyText = 'CỖ MÁY IN TIỀN?';
      action = 'Ảo tưởng cỗ máy in tiền béo bở mà người ngoài lầm tưởng';
    } else if (c.isCapacityParadox) {
      visualMethod = 'comparison';
      shotType = 'wide';
      keyText = '7.000 VS 200 CHỖ';
      action = 'Nghịch lý sức chứa: 7 ngàn thẻ bán ra nhưng sàn chỉ chứa nổi 200 người';
    } else if (c.isMachineWear) {
      visualMethod = 'character_action';
      shotType = 'medium';
      keyText = 'HAO MÒN MÁY MÓC';
      action = 'Người tập chăm chỉ làm hao mòn thiết bị và tăng chi phí bảo trì';
    } else if (c.isGhostIntro) {
      visualMethod = 'object_metaphor';
      shotType = 'medium';
      keyText = 'HỘI VIÊN VÔ HÌNH';
      action = 'Bí mật lợi nhuận nằm ở nhóm hội viên vô hình đóng tiền nhưng không đi tập';
    } else if (c.isGhostMemberSecret) {
      visualMethod = 'infographic';
      shotType = 'medium';
      keyText = '100% LỢI NHUẬN RÒNG';
      action = 'Người đóng tiền rồi lặn mất tăm mới mang lại 100% lợi nhuận ròng thuần túy';
    } else if (c.isRealityQuestion) {
      visualMethod = 'comparison';
      shotType = 'wide';
      keyText = 'BẢN CHẤT THỰC SỰ';
      action = 'Lật mở góc khuất vận hành đằng sau ánh đèn lung linh';
    } else if (c.isGymCost300k1M) {
      visualMethod = 'infographic';
      shotType = 'infographic';
      keyText = '$300K - $1M';
      action = 'Hoá đơn đầu tư ban đầu cực lớn cho thiết bị và cơ sở vật chất';
    } else if (c.isCashDrain) {
      visualMethod = 'numbers';
      shotType = 'infographic';
      keyText = 'CẠN KIỆT DÒNG TIỀN';
      action = 'Mua đứt thiết bị ngốn sạch vốn lưu động và dòng tiền dự phòng';
    } else if (c.isDebtLeasing) {
      visualMethod = 'comparison';
      shotType = 'wide';
      keyText = 'NỢ & LÃI SUẤT THUÊ';
      action = 'Gánh nặng nợ cố định và lãi suất thuê tài chính mỗi tháng';
    } else if (c.isJanuaryWave) {
      visualMethod = 'process';
      shotType = 'diagram';
      keyText = 'CÚ LỪA THÁNG 1';
      action = 'Làn sóng đăng ký ồ ạt sau Tết theo quyết tâm năm mới';
    } else if (c.isDropoff80) {
      visualMethod = 'numbers';
      shotType = 'infographic';
      keyText = '80% BỎ CUỘC';
      action = 'Phần lớn hội viên bỏ tập trước khi mùa hè bắt đầu';
    } else if (c.isContractTrap) {
      visualMethod = 'object_metaphor';
      shotType = 'close-up';
      keyText = 'RÀO CẢN HỦY THẺ';
      action = 'Khóa chặt thành viên bằng các điều khoản hợp đồng và phí ẩn';
    } else if (c.isAirConditioningBill) {
      visualMethod = 'infographic';
      shotType = 'infographic';
      keyText = 'TIỀN ĐIỆN 24/7';
      action = 'Hệ thống điều hòa máy lạnh 24/7 đốt sạch biên lợi nhuận';
    } else if (c.isSmallGroupPT) {
      visualMethod = 'character_action';
      shotType = 'medium';
      keyText = 'PT NHÓM 4 NGƯỜI';
      action = 'Vũ khí tối ưu doanh thu trên từng mét vuông mặt bằng';
    } else if (c.isSurvivalRule) {
      visualMethod = 'typography';
      shotType = 'medium';
      keyText = 'QUY LUẬT SINH TỒN';
      action = 'Mô hình kinh doanh phụ thuộc hoàn toàn vào những người không đến tập';
    }
  }
  // 2. Coffee-specific beats (ONLY when inside Coffee domain)
  else if (c.isCoffeeDomain) {
    if (c.isCoffeePrice) {
      visualMethod = 'comparison';
      shotType = 'wide';
      keyText = '50.000Đ VS 3.000Đ';
      action = 'So sánh giá bán ly cà phê với chi phí nguyên liệu thực tế';
    } else if (c.isCoffeeSpeed) {
      visualMethod = 'process';
      shotType = 'diagram';
      keyText = '60 GIÂY';
      action = 'Khách mua mang đi chớp nhoáng với tốc độ quay vòng lớn';
    } else if (c.isLaptopSitting6h) {
      visualMethod = 'character_action';
      shotType = 'medium';
      keyText = 'NGỒI SUỐT 6 TIẾNG';
      action = 'Khách cắm sạc laptop làm việc chiếm chỗ và hao mòn điện';
    } else if (c.isCoffeeStorefront) {
      visualMethod = 'infographic';
      shotType = 'infographic';
      keyText = 'TIỀN MẶT BẰNG';
      action = 'Chi phí mặt bằng đắc địa và máy pha espresso đè nặng lợi nhuận';
    }
  }
  // 3. Cooking / Culinary Domain
  else if (c.isCookingDomain) {
    if (/nước dùng|ninh|hầm|12 tiếng|10 tiếng|xương/i.test(clean)) {
      visualMethod = 'process';
      shotType = 'diagram';
      keyText = c.time ? c.time.toUpperCase() : 'NƯỚC DÙNG NINH';
      action = 'Nồi nước dùng ninh từ xương ống sôi sùng sục bốc khói nghi ngút';
    } else if (/gia vị|quế|hồi|thảo mộc|thảo quả|nêm nếm/i.test(clean)) {
      visualMethod = 'object_metaphor';
      shotType = 'close-up';
      keyText = 'GIA VỊ THẢO MỘC';
      action = 'Hoa hồi, thanh quế và thảo quả dậy mùi thơm phức';
    } else if (/thịt|bò|cá|bánh phở|tô|bát/i.test(clean)) {
      visualMethod = 'character_action';
      shotType = 'medium';
      keyText = 'THƯỞNG THỨC MÓN ĂN';
      action = 'Bát phở thơm ngon với những lát thịt thái mỏng hấp dẫn';
    } else {
      visualMethod = 'process';
      keyText = extractDynamicKeyText(clean, 'CÔNG THỨC');
      action = `Thực hiện công đoạn: ${clean.substring(0, 50)}...`;
    }
  }
  // 4. Tech / AI / Programming Domain
  else if (c.isTechOrCode) {
    if (/thuật toán|mô hình|neural|mạng nơ-ron|transformer|deep learning/i.test(clean)) {
      visualMethod = 'diagram';
      shotType = 'diagram';
      keyText = 'THUẬT TOÁN AI';
      action = 'Mạng nơ-ron nhân tạo kết nối và xử lý thông tin thông minh';
    } else if (/viết code|lập trình|developer|phần mềm|mã nguồn/i.test(clean)) {
      visualMethod = 'process';
      shotType = 'medium';
      keyText = 'LẬP TRÌNH PHẦN MỀM';
      action = 'Lập trình viên viết code và xây dựng ứng dụng số';
    } else {
      visualMethod = 'character_action';
      keyText = extractDynamicKeyText(clean, 'CÔNG NGHỆ SỐ');
      action = `Áp dụng công nghệ: ${clean.substring(0, 50)}...`;
    }
  }
  // 5. Dopamine / Shopping
  else if (c.isDopamineOrShopping) {
    visualMethod = 'object_metaphor';
    shotType = 'close-up';
    keyText = 'DOPAMINE HIT';
    action = 'Kích hoạt cơn hưng phấn thần kinh khi bấm nút mua hàng';
  }
  // 6. Wealth / Compounding
  else if (c.isCompoundingOrWealth) {
    visualMethod = 'numbers';
    shotType = 'infographic';
    keyText = c.percentage || c.money || 'LÃI KÉP';
    action = 'Sự bùng nổ của tài sản theo hàm số mũ theo thời gian';
  } else if (c.isAllocationRule) {
    visualMethod = 'infographic';
    shotType = 'infographic';
    keyText = c.percentage ? `QUY TẮC ${c.percentage}` : '50 / 30 / 20';
    action = 'Phân bổ tỷ lệ ngân sách vào các mục tiêu tài chính';
  }
  // 7. General Dynamic Concepts
  else if (c.percentage) {
    visualMethod = 'numbers';
    shotType = 'infographic';
    keyText = c.percentage;
    action = `Làm nổi bật chỉ số tỷ lệ: ${c.percentage}`;
  } else if (c.money) {
    visualMethod = 'numbers';
    shotType = 'infographic';
    keyText = c.money.toUpperCase();
    action = `Nhấn mạnh giá trị tài chính: ${c.money}`;
  } else if (c.isComparison) {
    visualMethod = 'comparison';
    shotType = 'wide';
    keyText = 'SO SÁNH ĐỐI LẬP';
    action = 'Đối chiếu hai mặt của vấn đề';
  } else if (c.isConclusionOrWisdom) {
    visualMethod = 'typography';
    shotType = 'medium';
    keyText = extractDynamicKeyText(clean, 'BÀI HỌC CỐT LÕI');
    action = 'Đúc kết nguyên tắc vàng quan trọng nhất';
  } else {
    // Alternating visual styles based on beat position
    const methodsPool = ['character_action', 'process', 'object_metaphor', 'comparison'];
    visualMethod = methodsPool[(beatIndex - 1) % methodsPool.length];
    keyText = extractDynamicKeyText(clean, sceneTitle);
    action = `Diễn đạt trực quan: ${clean.substring(0, 50)}...`;
  }

  // Prevent consecutive identical layouts
  if (prevMethod && visualMethod === prevMethod) {
    const pool = ['comparison', 'object_metaphor', 'character_action', 'numbers', 'process', 'typography'];
    visualMethod = pool.find((m) => m !== prevMethod) || 'character_action';
  }

  return {
    meaning,
    subject,
    action,
    objects: [],
    environment: 'Clean studio',
    composition: 'Center focused',
    shotType,
    visualMethod,
    keyText: keyText.substring(0, 24).toUpperCase(),
    mustNotInclude: [],
    transitionIntent: 'Nối tiếp mạch diễn giải',
    imageGenerationPrompt: `2D minimalist stickman explainer illustration, ${subject}: ${action}. Clean vector comic style, warm paper texture background, 1080p high resolution.`,
  };
}

/**
 * AI Visual Planner with Smart Fallback
 */
async function planVisualBeatsWithAI({ scene, beats, styleGuide, geminiApiKey, previousMethod }) {
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;

  try {
    const beatsSummary = beats
      .map((b, i) => `Beat ${i + 1} (${b.duration_in_seconds}s): "${b.text}"`)
      .join('\n');

    const prompt = `You are a World-Class Storyboard Director for YouTube explainer videos.
Scene Title: "${scene.title}"
Narration: "${scene.text}"

Segmented Beats:
${beatsSummary}

Previous visual method: "${previousMethod || 'none'}"

Plan a structured visual beat plan for each beat.
Crucial rules:
1. NO HALLUCINATIONS: only draw items directly relevant to the script.
2. Diverse visual methods: alternate between 'character_action', 'object_metaphor', 'comparison', 'infographic', 'numbers', 'process', 'typography', 'environment'.
3. 'keyText': 1 to 3 punchy Vietnamese words or exact metric.

Return JSON array with ${beats.length} items:
[
  {
    "meaning": "Brief summary",
    "subject": "Main subject",
    "action": "Specific visual action",
    "objects": ["obj1", "obj2"],
    "visualMethod": "character_action | object_metaphor | comparison | infographic | numbers | process | typography | environment",
    "keyText": "1-3 uppercase words"
  }
]`;

    const candidateModels = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const json = JSON.parse(rawText);
            if (Array.isArray(json) && json.length === beats.length) {
              return json.map((p) => ({
                meaning: p.meaning || '',
                subject: p.subject || 'Chủ thể chính',
                action: p.action || 'Hành động minh họa',
                objects: Array.isArray(p.objects) ? p.objects : [],
                environment: 'Clean studio',
                composition: 'Center focused',
                shotType: 'medium',
                visualMethod: p.visualMethod || 'character_action',
                keyText: (p.keyText || '').toUpperCase(),
                mustNotInclude: [],
                transitionIntent: '',
                imageGenerationPrompt: p.imageGenerationPrompt || `2D minimalist stickman explainer illustration, ${p.subject || 'stickman'}: ${p.action || 'explaining concept'}. Clean vector comic style, warm paper background, 1080p high resolution.`,
              }));
            }
          }
        }
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

/**
 * Semantic Validator
 */
function validateVisualBeat({ beatText, plan }) {
  const issues = [];
  let score = 100;
  const lowerText = (beatText || '').toLowerCase();
  const lowerKeyText = (plan.keyText || '').toLowerCase();

  const bannedKeywords = ['beer', 'bia', 'quán bia', 'két bia'];
  for (const banned of bannedKeywords) {
    if (!lowerText.includes(banned) && lowerKeyText.includes(banned)) {
      issues.push(`Hallucination không liên quan: "${banned}"`);
      score -= 30;
    }
  }

  if ((plan.keyText || '').split(/\s+/).length > 5) {
    issues.push('KeyText dài hơn 5 từ');
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    issues,
    regenerate: score < 80,
  };
}

/**
 * Bespoke 1920x1080 Vector SVG Synthesizer
 * Draws genuine topic-specific illustrations without static templates.
 */
function generateSemanticSvgForBeat({ beat, scene, styleGuide }) {
  const guide = styleGuide || createVideoStyleGuide();
  const plan = beat.plan || {};
  const p = guide.palette;
  const sw = guide.strokeWidth;
  const text = (beat.text || beat.caption || beat.plan?.meaning || '').trim();
  const c = extractSemanticConcepts(text, { sceneTitle: scene?.title, sceneText: scene?.text, videoTitle: scene?.videoTitle });
  const keyText = escapeXml(plan.keyText || c.percentage || c.money || c.time || 'Ý CHÍNH');
  const method = plan.visualMethod || 'character_action';

  let contentSvg = '';

  // 1. Gym Domain Beats
  if (c.isGymEntrance) {
    contentSvg = renderGymEntrance(p, sw);
  } else if (c.isGymRushHour) {
    contentSvg = renderGymRushHour(p, sw);
  } else if (c.isCashMachineDelusion) {
    contentSvg = renderCashPrintingMint(p, sw);
  } else if (c.isCapacityParadox) {
    contentSvg = renderCapacityParadox(p, sw);
  } else if (c.isMachineWear) {
    contentSvg = renderMachineWearSparks(p, sw);
  } else if (c.isGhostIntro) {
    contentSvg = renderGhostMysteryIntro(p, sw);
  } else if (c.isGhostMemberSecret) {
    contentSvg = renderGhostMemberSecret(p, sw);
  } else if (c.isRealityQuestion) {
    contentSvg = renderRealityQuestionSplit(p, sw);
  } else if (c.isGymCost300k1M) {
    contentSvg = renderGymCost300k1M(p, sw);
  } else if (c.isCashDrain) {
    contentSvg = renderCashReserveDrain(p, sw);
  } else if (c.isDebtLeasing) {
    contentSvg = renderDebtAnvilLeasing(p, sw);
  } else if (c.isJanuaryWave) {
    contentSvg = renderJanuaryWave(p, sw);
  } else if (c.isDropoff80) {
    contentSvg = renderDropoff80(p, sw);
  } else if (c.isContractTrap) {
    contentSvg = renderContractTrap(p, sw);
  } else if (c.isAirConditioningBill) {
    contentSvg = renderAirConditioningBill(p, sw);
  } else if (c.isSmallGroupPT) {
    contentSvg = renderSmallGroupPT(p, sw);
  } else if (c.isSurvivalRule) {
    contentSvg = renderSurvivalRule(p, sw);
  }
  // 2. Coffee Domain Beats
  else if (c.isCoffeePrice) {
    contentSvg = renderCoffeePrice(p, sw);
  } else if (c.isCoffeeSpeed) {
    contentSvg = renderCoffeeSpeed(p, sw);
  } else if (c.isLaptopSitting6h) {
    contentSvg = renderLaptopTech(p, sw);
  } else if (c.isCoffeeStorefront) {
    contentSvg = renderCoffeeStorefront(p, sw);
  }
  // 3. Dopamine / Shopping
  else if (c.isDopamineOrShopping) {
    contentSvg = renderShoppingDopamine(p, sw);
  }
  // 4. Wealth / Compounding
  else if (c.isCompoundingOrWealth) {
    contentSvg = renderCompoundingGrowth(p, sw);
  } else if (c.isAllocationRule) {
    contentSvg = renderAllocationJars(p, sw);
  } else if (c.isTechOrCode) {
    contentSvg = renderTechCode(p, sw);
  }
  // 5. Cooking / Culinary Domain
  else if (c.isCookingDomain) {
    if (/nước dùng|ninh|hầm|12 tiếng|10 tiếng|xương/i.test(text)) {
      contentSvg = renderCookingBrothPot(p, sw, keyText);
    } else {
      contentSvg = renderCookingChefStickman(p, sw, plan, text);
    }
  }
  // 6. Dynamic Fallbacks
  else {
    switch (method) {
      case 'comparison':
        contentSvg = renderGenericComparison(c, text, plan, p, sw);
        break;
      case 'numbers':
      case 'infographic':
        contentSvg = renderGenericNumbers(c, text, plan, p, sw);
        break;
      case 'process':
        contentSvg = renderGenericProcess(c, text, plan, p, sw);
        break;
      case 'typography':
        contentSvg = renderGenericTypography(c, text, plan, p, sw);
        break;
      case 'object_metaphor':
        contentSvg = renderGenericMetaphor(c, text, plan, p, sw);
        break;
      default:
        contentSvg = renderGenericCharacter(c, text, plan, p, sw);
        break;
    }
  }

  return `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="${p.background}" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0F172A" flood-opacity="0.08"/>
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.06"/>
        </filter>
      </defs>

      <rect width="1920" height="1080" fill="url(#bgGlow)" />

      <g opacity="0.025">
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="2" fill="${p.outline}" />
        </pattern>
        <rect width="1920" height="1080" fill="url(#grid)" />
      </g>

      ${contentSvg}

      <!-- Top Stylized KeyText Pill Badge -->
      <g transform="translate(960, 80)">
        <rect x="-260" y="-35" width="520" height="70" rx="35" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw - 1}" filter="url(#cardShadow)"/>
        <circle cx="-205" cy="0" r="10" fill="${p.accent}" />
        <text x="-175" y="11" font-family="${guide.typography}" font-weight="900" font-size="28" fill="${p.outline}" letter-spacing="1.2">
          ${keyText}
        </text>
      </g>
    </svg>
  `;
}

// ==================== BESPOKE VECTOR SCENE RENDERERS ====================

function renderGymEntrance(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-600" y="-270" width="1200" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <!-- Gym Glass Entrance Exterior Facade -->
      <g transform="translate(-240, 20)">
        <rect x="-180" y="-180" width="360" height="340" rx="16" fill="#1E293B"/>
        <rect x="-150" y="-140" width="140" height="300" fill="#FEF3C7" opacity="0.35" stroke="#FFFFFF" stroke-width="4"/>
        <rect x="10" y="-140" width="140" height="300" fill="#FEF3C7" opacity="0.35" stroke="#FFFFFF" stroke-width="4"/>
        <rect x="-30" y="-20" width="12" height="60" rx="4" fill="${p.accent}"/>
        <rect x="18" y="-20" width="12" height="60" rx="4" fill="${p.accent}"/>
        <rect x="-130" y="-240" width="260" height="65" rx="14" fill="#0F172A" stroke="${p.danger}" stroke-width="5"/>
        <text x="0" y="-197" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" fill="${p.danger}" text-anchor="middle" letter-spacing="4">FITNESS GYM</text>
      </g>
      <!-- Stickman walking into gym enthusiastically -->
      <g transform="translate(240, 40)">
        <circle cx="0" cy="-60" r="50" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
        <circle cx="18" cy="-65" r="7" fill="${p.outline}"/>
        <path d="M 12 -42 Q 25 -32 40 -45" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
        <path d="M -45 -70 Q 0 -85 45 -70" stroke="${p.primary}" stroke-width="7" stroke-linecap="round"/>
        <line x1="0" y1="-10" x2="-20" y2="100" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
        <path d="M -20 100 L 40 140 L 70 210" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M -20 100 L -70 145 L -50 210" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M -10 20 L -60 10 L -120 20" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M -10 20 L 50 40 L 80 15" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <text x="0" y="260" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">BƯỚC VÀO PHÒNG GYM</text>
      </g>
    </g>
  `;
}

function renderGymRushHour(p, sw) {
  return `
    <g transform="translate(620, 520)">
      <ellipse cx="0" cy="270" rx="260" ry="24" fill="${p.outline}" opacity="0.08" />
      <path d="M -220 220 L 160 220 L 130 260 L -250 260 Z" fill="${p.outline}" stroke="${p.outline}" stroke-width="4"/>
      <line x1="-200" y1="238" x2="130" y2="238" stroke="${p.secondary}" stroke-width="4" stroke-dasharray="16 12"/>
      <line x1="80" y1="220" x2="40" y2="0" stroke="${p.outline}" stroke-width="12" stroke-linecap="round"/>
      <g transform="translate(30, 0)">
        <rect x="-50" y="-40" width="100" height="70" rx="12" fill="${p.card}" stroke="${p.outline}" stroke-width="6"/>
        <text x="0" y="-12" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="14" fill="${p.muted}" text-anchor="middle">SPEED</text>
        <text x="0" y="16" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.danger}" text-anchor="middle">12.5</text>
      </g>
      <g transform="translate(-70, -20)">
        <circle cx="20" cy="-60" r="50" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
        <path d="M 45 -45 Q 60 -55 70 -40" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
        <path d="M 40 -85 Q 60 -95 70 -75" stroke="${p.primary}" stroke-width="6" stroke-linecap="round"/>
        <path d="M 80 -60 Q 95 -65 85 -50 Z" fill="#38BDF8"/>
        <line x1="10" y1="-10" x2="-30" y2="120" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
        <path d="M -30 120 L 50 170 L 90 235" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M -30 120 L -90 180 L -50 240" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 0 30 L 60 50 L 50 10" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      </g>
      <text x="-40" y="320" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="26" fill="${p.outline}" text-anchor="middle">MÁY CHẠY BỘ KÍN CHỖ</text>
    </g>

    <g transform="translate(1320, 520)">
      <rect x="-240" y="-180" width="480" height="380" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-200" y="50" width="400" height="110" rx="16" fill="${p.outline}"/>
      <text x="0" y="115" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="26" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">QUẦY LỄ TÂN</text>
      <circle cx="100" cy="-20" r="38" fill="${p.card}" stroke="${p.outline}" stroke-width="6"/>
      <line x1="100" y1="18" x2="100" y2="70" stroke="${p.outline}" stroke-width="7"/>
      <g transform="translate(-100, 20)">
        <circle cx="-50" cy="-40" r="32" fill="${p.card}" stroke="${p.outline}" stroke-width="6"/>
        <line x1="-50" y1="-8" x2="-50" y2="80" stroke="${p.outline}" stroke-width="6"/>
        <circle cx="20" cy="-35" r="32" fill="${p.card}" stroke="${p.outline}" stroke-width="6"/>
        <line x1="20" y1="-3" x2="20" y2="80" stroke="${p.outline}" stroke-width="6"/>
      </g>
      <g transform="translate(0, -90) rotate(-8)">
        <rect x="-130" y="-35" width="260" height="70" rx="16" fill="${p.danger}" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="12" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">GIỜ CAO ĐIỂM</text>
      </g>
      <text x="0" y="240" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.muted}" text-anchor="middle">Hàng dài chờ đợi</text>
    </g>
  `;
}

function renderCashPrintingMint(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-180, 0)">
        <rect x="-160" y="-120" width="320" height="240" rx="20" fill="#334155" stroke="${p.outline}" stroke-width="6"/>
        <rect x="-100" y="-70" width="200" height="80" rx="10" fill="#0F172A"/>
        <line x1="160" y1="0" x2="220" y2="-50" stroke="${p.outline}" stroke-width="10" stroke-linecap="round"/>
        <circle cx="220" cy="-50" r="14" fill="${p.accent}"/>
        <g transform="translate(0, 70)">
          <rect x="-80" y="0" width="160" height="60" rx="8" fill="#10B981" stroke="${p.outline}" stroke-width="4"/>
          <text x="0" y="42" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="36" fill="#FFFFFF" text-anchor="middle">$$$</text>
        </g>
        <text x="0" y="-150" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="30" fill="${p.secondary}" text-anchor="middle">CỖ MÁY IN TIỀN BÉO BỞ?</text>
      </g>
      <g transform="translate(300, 20)">
        <circle cx="0" cy="-60" r="55" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
        <circle cx="-16" cy="-65" r="7" fill="${p.outline}"/>
        <circle cx="16" cy="-65" r="7" fill="${p.outline}"/>
        <path d="M -15 -35 Q 0 -25 15 -35" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
        <text x="90" y="-80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="90" fill="${p.accent}">$</text>
        <line x1="0" y1="-5" x2="0" y2="120" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
        <path d="M 0 30 L -50 0 L -60 -40" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M 0 120 L -40 200 M 0 120 L 40 200" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <text x="0" y="240" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="26" fill="${p.outline}" text-anchor="middle">AI CŨNG LẦM TƯỞNG</text>
      </g>
    </g>
  `;
}

function renderRealityQuestionSplit(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-240, 0)">
        <rect x="-180" y="-180" width="360" height="360" rx="28" fill="#F8FAFC" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="-100" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="26" fill="${p.primary}" text-anchor="middle">VẺ NGOÀI HÀO NHOÁNG</text>
        <circle cx="0" cy="10" r="60" fill="${p.highlight}" stroke="${p.accent}" stroke-width="5"/>
        <text x="0" y="28" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="60" fill="${p.accent}" text-anchor="middle">★</text>
        <text x="0" y="120" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="20" fill="${p.muted}" text-anchor="middle">Đông đúc, sang trọng</text>
      </g>
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="50" fill="${p.accent}" stroke="${p.outline}" stroke-width="${sw}"/>
        <text x="0" y="16" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="50" fill="${p.outline}" text-anchor="middle">?</text>
      </g>
      <g transform="translate(240, 0)">
        <rect x="-180" y="-180" width="360" height="360" rx="28" fill="#FEF2F2" stroke="${p.danger}" stroke-width="5"/>
        <text x="0" y="-100" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="26" fill="${p.danger}" text-anchor="middle">BẢN CHẤT SỰ THẬT</text>
        <circle cx="0" cy="10" r="60" fill="#FEE2E2" stroke="${p.danger}" stroke-width="5"/>
        <path d="M -30 -10 L 0 20 L 30 -20" fill="none" stroke="${p.danger}" stroke-width="8" stroke-linecap="round"/>
        <text x="0" y="120" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="20" fill="${p.danger}" text-anchor="middle">Góc khuất dòng tiền</text>
      </g>
    </g>
  `;
}

function renderGymCost300k1M(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-600" y="-270" width="1200" height="540" rx="40" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-380, 40)">
        <ellipse cx="0" cy="180" rx="110" ry="18" fill="${p.outline}" opacity="0.08" />
        <path d="M -45 -95 Q 0 -140 45 -95 Z" fill="${p.accent}" stroke="${p.outline}" stroke-width="6"/>
        <line x1="-55" y1="-95" x2="55" y2="-95" stroke="${p.outline}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="0" cy="-60" r="50" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
        <circle cx="-16" cy="-65" r="8" fill="${p.outline}"/>
        <circle cx="16" cy="-65" r="8" fill="${p.outline}"/>
        <ellipse cx="0" cy="-35" rx="14" ry="18" fill="${p.outline}"/>
        <line x1="0" y1="-10" x2="0" y2="100" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
        <path d="M 0 15 L -45 -10 L -45 -55" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M 0 15 L 45 -10 L 45 -55" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <path d="M 0 100 L -40 180 M 0 100 L 40 180" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      </g>
      <g transform="translate(100, -30)">
        <rect x="-240" y="-160" width="480" height="300" rx="20" fill="#FEF2F2" stroke="${p.danger}" stroke-width="6" stroke-dasharray="14 10"/>
        <text x="0" y="-100" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.danger}" text-anchor="middle">HOÁ ĐƠN ĐẦU TƯ BAN ĐẦU</text>
        <text x="0" y="-20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="54" fill="${p.danger}" text-anchor="middle">$300K - $1M</text>
        <line x1="-180" y1="30" x2="180" y2="30" stroke="${p.outline}" stroke-width="3" stroke-dasharray="8 8"/>
        <text x="0" y="70" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="22" fill="${p.outline}" text-anchor="middle">Thiết bị đắt đỏ • Lãi suất thuê tài chính</text>
        <text x="0" y="105" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Ngốn sạch dòng tiền dự phòng</text>
      </g>
      <g transform="translate(420, 110)">
        <rect x="-80" y="-12" width="160" height="24" rx="6" fill="${p.outline}"/>
        <rect x="-105" y="-55" width="25" height="110" rx="8" fill="#334155" stroke="${p.outline}" stroke-width="4"/>
        <rect x="-130" y="-45" width="25" height="90" rx="8" fill="#475569" stroke="${p.outline}" stroke-width="4"/>
        <rect x="80" y="-55" width="25" height="110" rx="8" fill="#334155" stroke="${p.outline}" stroke-width="4"/>
        <rect x="105" y="-45" width="25" height="90" rx="8" fill="#475569" stroke="${p.outline}" stroke-width="4"/>
        <text x="0" y="55" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="20" fill="${p.muted}" text-anchor="middle">20 KG</text>
      </g>
    </g>
  `;
}

function renderCashReserveDrain(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-180, 0)">
        <rect x="-160" y="-140" width="320" height="280" rx="20" fill="#334155" stroke="${p.outline}" stroke-width="7"/>
        <circle cx="0" cy="0" r="50" fill="#0F172A" stroke="${p.outline}" stroke-width="5"/>
        <path d="M 0 -50 L 0 50 M -50 0 L 50 0" stroke="${p.accent}" stroke-width="6"/>
        <text x="0" y="90" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.danger}" text-anchor="middle">DỰ PHÒNG: 0$</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" fill="${p.danger}" text-anchor="middle">NGỐN SẠCH DÒNG TIỀN</text>
        <path d="M -150 -10 L 0 60 L 150 -10" fill="none" stroke="${p.danger}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="0" y="110" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.muted}" text-anchor="middle">Mua đứt máy móc triệt tiêu vốn lưu động</text>
      </g>
    </g>
  `;
}

function renderDebtAnvilLeasing(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(0, -20)">
        <path d="M -180 80 L 180 80 L 130 -40 L -130 -40 Z" fill="#475569" stroke="${p.outline}" stroke-width="8"/>
        <rect x="-70" y="-120" width="140" height="80" rx="10" fill="#334155" stroke="${p.outline}" stroke-width="7"/>
        <text x="0" y="-60" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">NỢ CỐ ĐỊNH</text>
        <text x="0" y="40" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="54" fill="${p.danger}" text-anchor="middle">+ LÃI SUẤT THUÊ</text>
      </g>
      <text x="0" y="200" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="26" fill="${p.muted}" text-anchor="middle">Gánh nặng định kỳ đè bẹp lợi nhuận chủ phòng</text>
    </g>
  `;
}

function renderGhostMysteryIntro(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <!-- Detective Stickman looking through magnifying glass -->
      <g transform="translate(-240, 20)">
        <ellipse cx="0" cy="180" rx="140" ry="20" fill="${p.outline}" opacity="0.08" />
        <circle cx="0" cy="-60" r="50" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
        <!-- Fedora hat -->
        <path d="M -60 -75 L 60 -75 M -40 -75 L -30 -115 L 30 -115 L 40 -75" stroke="${p.outline}" stroke-width="7" fill="#334155" stroke-linejoin="round"/>
        <!-- Torso -->
        <line x1="0" y1="-10" x2="0" y2="100" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
        <line x1="0" y1="100" x2="-40" y2="170" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <line x1="0" y1="100" x2="40" y2="170" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <!-- Arm holding magnifying glass -->
        <path d="M 0 30 L 70 10 L 130 0" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
        <!-- Giant Magnifying Glass -->
        <circle cx="160" cy="-5" r="45" fill="#FEF3C7" opacity="0.5" stroke="${p.outline}" stroke-width="6"/>
        <line x1="190" y1="25" x2="225" y2="60" stroke="${p.outline}" stroke-width="12" stroke-linecap="round"/>
        <text x="160" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" fill="${p.accent}" text-anchor="middle">?</text>
        <text x="0" y="230" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">ĐIỀU TRA BÍ MẬT</text>
      </g>
      <!-- Mystery Glowing Member Card -->
      <g transform="translate(220, 0)">
        <rect x="-180" y="-120" width="360" height="230" rx="24" fill="#0F172A" stroke="${p.accent}" stroke-width="6"/>
        <rect x="-150" y="-90" width="60" height="40" rx="8" fill="#F59E0B"/>
        <text x="0" y="-20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">VIP MEMBER</text>
        <line x1="-140" y1="20" x2="140" y2="20" stroke="#334155" stroke-width="4"/>
        <text x="0" y="60" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="22" fill="${p.accent}" text-anchor="middle">HỘI VIÊN VÔ HÌNH</text>
      </g>
    </g>
  `;
}

function renderGhostMemberSecret(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-180, 0)">
        <circle cx="0" cy="0" r="160" fill="#F8FAFC" stroke="${p.outline}" stroke-width="${sw}" stroke-dasharray="16 12"/>
        <circle cx="0" cy="-40" r="50" fill="${p.card}" stroke="${p.muted}" stroke-width="5" stroke-dasharray="8 6"/>
        <path d="M 0 10 L 0 90 M 0 90 L -30 140 M 0 90 L 30 140" stroke="${p.muted}" stroke-width="5" stroke-dasharray="8 6"/>
        <text x="0" y="-30" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.muted}" text-anchor="middle">GHOST</text>
      </g>
      <g transform="translate(240, 0)">
        <rect x="-180" y="-120" width="360" height="240" rx="24" fill="#DCFCE7" stroke="${p.secondary}" stroke-width="6"/>
        <text x="0" y="-40" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="64" fill="${p.secondary}" text-anchor="middle">100%</text>
        <text x="0" y="20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">LỢI NHUẬN RÒNG</text>
        <text x="0" y="65" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Đóng tiền rồi lặn mất tăm</text>
      </g>
    </g>
  `;
}

function renderMachineWearSparks(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-180, 0)">
        <circle cx="0" cy="0" r="140" fill="#FEF3C7" stroke="${p.outline}" stroke-width="6"/>
        <line x1="-100" y1="0" x2="100" y2="0" stroke="${p.outline}" stroke-width="12" stroke-linecap="round"/>
        <circle cx="-100" cy="0" r="25" fill="${p.outline}"/>
        <circle cx="100" cy="0" r="25" fill="${p.outline}"/>
        <path d="M 0 -40 L -20 -90 L 10 -90 L -10 -130" fill="none" stroke="${p.danger}" stroke-width="6" stroke-linecap="round"/>
        <text x="0" y="50" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.danger}" text-anchor="middle">MAO MÒN 200%</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-50" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="38" fill="${p.outline}" text-anchor="middle">NGƯỜI TẬP CHĂM CHỈ</text>
        <text x="0" y="20" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.danger}" text-anchor="middle">TĂNG CHI PHÍ BẢO TRÌ</text>
        <text x="0" y="70" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Càng đến đông, máy móc càng nhanh hỏng</text>
      </g>
    </g>
  `;
}

function renderCapacityParadox(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-580" y="-270" width="1160" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-270, 0)">
        <rect x="-220" y="-170" width="440" height="340" rx="28" fill="#EFF6FF" stroke="${p.primary}" stroke-width="5"/>
        <text x="0" y="-80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="54" fill="${p.primary}" text-anchor="middle">7.000</text>
        <text x="0" y="-20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">THẺ ĐÃ BÁN RA</text>
        <text x="0" y="40" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="20" fill="${p.muted}" text-anchor="middle">Doanh thu định kỳ</text>
      </g>
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="45" fill="${p.accent}" stroke="${p.outline}" stroke-width="6"/>
        <text x="0" y="12" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="30" fill="${p.outline}" text-anchor="middle">VS</text>
      </g>
      <g transform="translate(270, 0)">
        <rect x="-220" y="-170" width="440" height="340" rx="28" fill="#FEF2F2" stroke="${p.danger}" stroke-width="5"/>
        <text x="0" y="-80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="54" fill="${p.danger}" text-anchor="middle">200 CHỖ</text>
        <text x="0" y="-20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">SỨC CHỨA SÀN TỐI ĐA</text>
        <text x="0" y="40" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="20" fill="${p.danger}" text-anchor="middle">Vỡ trận nếu 10% cùng đi tập!</text>
      </g>
    </g>
  `;
}

function renderJanuaryWave(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-240, 0)">
        <rect x="-140" y="-140" width="280" height="280" rx="24" fill="#FFFFFF" stroke="${p.outline}" stroke-width="6"/>
        <rect x="-140" y="-140" width="280" height="70" rx="24" fill="${p.danger}"/>
        <text x="0" y="-95" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">THÁNG MỘT</text>
        <text x="0" y="30" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="80" fill="${p.danger}" text-anchor="middle">12%</text>
        <text x="0" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="18" fill="${p.outline}" text-anchor="middle">ĐĂNG KÝ Ồ ẠT</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-50" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" fill="${p.outline}" text-anchor="middle">CÚ LỪA NĂM MỚI</text>
        <text x="0" y="20" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="26" fill="${p.accent}" text-anchor="middle">Quyết tâm giảm cân bùng nổ</text>
        <text x="0" y="70" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="20" fill="${p.muted}" text-anchor="middle">Cỗ máy thu hút dòng tiền lớn nhất năm</text>
      </g>
    </g>
  `;
}

function renderDropoff80(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-180, 0)">
        <circle cx="0" cy="0" r="150" fill="#FEE2E2" stroke="${p.danger}" stroke-width="6"/>
        <text x="0" y="20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="90" fill="${p.danger}" text-anchor="middle">80%</text>
        <text x="0" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.danger}" text-anchor="middle">BỎ CUỘC</text>
      </g>
      <g transform="translate(260, 0)">
        <text x="0" y="-50" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="40" fill="${p.outline}" text-anchor="middle">TRƯỚC KHI MÙA HÈ ĐẾN</text>
        <text x="0" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.secondary}" text-anchor="middle">Phòng tập vắng tanh trở lại</text>
        <text x="0" y="60" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Nhưng tiền thẻ đã thu đủ 1 năm!</text>
      </g>
    </g>
  `;
}

function renderContractTrap(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-200, 0)">
        <rect x="-120" y="-160" width="240" height="320" rx="16" fill="#F8FAFC" stroke="${p.outline}" stroke-width="6"/>
        <circle cx="0" cy="-30" r="40" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <line x1="-80" y1="60" x2="80" y2="60" stroke="${p.danger}" stroke-width="12" stroke-linecap="round"/>
        <text x="0" y="110" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.danger}" text-anchor="middle">HỦY = KHÔNG THỂ</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-60" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="38" fill="${p.outline}" text-anchor="middle">RÀO CẢN HỦY THẺ</text>
        <text x="0" y="0" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.danger}" text-anchor="middle">+ CHI PHÍ ẨN ÂM NHẠC</text>
        <text x="0" y="60" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Điều khoản trói chân hội viên chặt chẽ</text>
      </g>
    </g>
  `;
}

function renderAirConditioningBill(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-200, 0)">
        <rect x="-160" y="-80" width="320" height="160" rx="16" fill="#E0F2FE" stroke="${p.primary}" stroke-width="6"/>
        <line x1="-120" y1="20" x2="120" y2="20" stroke="${p.primary}" stroke-width="6"/>
        <path d="M -80 60 L -60 120 M 0 60 L 0 120 M 80 60 L 60 120" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
        <text x="0" y="-20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.primary}" text-anchor="middle">MÁY LẠNH 24/7</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-60" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="40" fill="${p.danger}" text-anchor="middle">TIỀN ĐIỆN KHỔNG LỒ</text>
        <text x="0" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.outline}" text-anchor="middle">BÀO MÒN TÚI TIỀN CHỦ PHÒNG</text>
        <text x="0" y="60" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Chi phí vận hành cố định không thể cắt giảm</text>
      </g>
    </g>
  `;
}

function renderSmallGroupPT(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-240, 0)">
        <rect x="-140" y="-140" width="280" height="280" rx="28" fill="#ECFDF5" stroke="${p.secondary}" stroke-width="6"/>
        <circle cx="-50" cy="-40" r="22" fill="${p.secondary}"/>
        <circle cx="50" cy="-40" r="22" fill="${p.secondary}"/>
        <circle cx="-50" cy="40" r="22" fill="${p.secondary}"/>
        <circle cx="50" cy="40" r="22" fill="${p.secondary}"/>
        <text x="0" y="115" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.secondary}" text-anchor="middle">NHÓM 4 NGƯỜI</text>
      </g>
      <g transform="translate(240, 0)">
        <text x="0" y="-60" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="40" fill="${p.secondary}" text-anchor="middle">VŨ KHÍ ĐÒN BẨY PT</text>
        <text x="0" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="26" fill="${p.outline}" text-anchor="middle">Tối ưu doanh thu / m2</text>
        <text x="0" y="65" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">Nhân bản giá trị dịch vụ huấn luyện</text>
      </g>
    </g>
  `;
}

function renderSurvivalRule(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-580" y="-270" width="1160" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="-50" r="80" fill="${p.highlight}" stroke="${p.accent}" stroke-width="6"/>
      <text x="0" y="-25" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="70" fill="${p.accent}" text-anchor="middle">🔑</text>
      <text x="0" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="36" fill="${p.outline}" text-anchor="middle">
        SỐNG SÓT NHỜ NGƯỜI TRẢ TIỀN NHƯNG KHÔNG ĐẾN
      </text>
      <text x="0" y="130" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.secondary}" text-anchor="middle">
        Bản chất thực sự của mô hình kinh doanh phòng gym
      </text>
    </g>
  `;
}

function renderCoffeePrice(p, sw) {
  return `
    <g transform="translate(620, 520)">
      <ellipse cx="0" cy="270" rx="190" ry="26" fill="${p.outline}" opacity="0.08" />
      <path d="M -130 -160 L 130 -160 L 95 240 L -95 240 Z" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" stroke-linejoin="round" />
      <rect x="-150" y="-200" width="300" height="42" rx="16" fill="${p.outline}" stroke="${p.outline}" stroke-width="4" />
      <rect x="-120" y="-40" width="240" height="150" rx="14" fill="#D97706" stroke="${p.outline}" stroke-width="${sw}" />
      <circle cx="0" cy="35" r="40" fill="${p.card}" stroke="${p.outline}" stroke-width="5" />
      <ellipse cx="0" cy="35" rx="16" ry="24" fill="#78350F" transform="rotate(25 0 35)" />
      <path d="M -40 -230 Q -60 -280 -30 -330 M 0 -230 Q 30 -290 0 -350 M 40 -230 Q 20 -280 50 -330" fill="none" stroke="${p.muted}" stroke-width="6" stroke-linecap="round" />
      <g transform="translate(130, -120) rotate(12)">
        <path d="M 0 0 L -30 -30" stroke="${p.outline}" stroke-width="4"/>
        <rect x="0" y="-30" width="230" height="65" rx="16" fill="${p.danger}" stroke="${p.outline}" stroke-width="5" />
        <text x="115" y="14" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">50.000Đ</text>
      </g>
    </g>

    <g transform="translate(960, 540)">
      <circle cx="0" cy="0" r="45" fill="${p.accent}" stroke="${p.outline}" stroke-width="${sw}"/>
      <text x="0" y="12" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="32" fill="${p.outline}" text-anchor="middle">VS</text>
    </g>

    <g transform="translate(1320, 520)">
      <ellipse cx="0" cy="270" rx="160" ry="24" fill="${p.outline}" opacity="0.08" />
      <ellipse cx="0" cy="200" rx="130" ry="45" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" />
      <ellipse cx="-45" cy="185" rx="20" ry="30" fill="#78350F" stroke="${p.outline}" stroke-width="4" transform="rotate(-30 -45 185)"/>
      <ellipse cx="0" cy="175" rx="22" ry="32" fill="#78350F" stroke="${p.outline}" stroke-width="4" />
      <ellipse cx="45" cy="185" rx="20" ry="30" fill="#78350F" stroke="${p.outline}" stroke-width="4" transform="rotate(30 45 185)"/>
      <g transform="translate(0, 0)">
        <rect x="-105" y="-30" width="210" height="60" rx="16" fill="${p.secondary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="12" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">3.000Đ</text>
      </g>
      <text x="0" y="340" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="26" fill="${p.muted}" text-anchor="middle">Hạt cà phê &amp; nước</text>
    </g>
  `;
}

function renderCoffeeSpeed(p, sw) {
  return `
    <g transform="translate(680, 520)">
      <ellipse cx="0" cy="280" rx="140" ry="20" fill="${p.outline}" opacity="0.08" />
      <circle cx="20" cy="-60" r="55" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" />
      <circle cx="40" cy="-70" r="6" fill="${p.outline}" />
      <path d="M 35 -45 Q 50 -35 60 -50" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
      <line x1="10" y1="-5" x2="-40" y2="130" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
      <path d="M -40 130 L 40 180 L 100 270" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M -40 130 L -110 200 L -70 275" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M -10 30 L 60 40 L 90 -10" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <g transform="translate(100, -50) rotate(15)">
        <path d="M -20 -30 L 20 -30 L 15 30 L -15 30 Z" fill="#D97706" stroke="${p.outline}" stroke-width="4"/>
        <rect x="-24" y="-36" width="48" height="8" rx="3" fill="${p.outline}"/>
      </g>
      <line x1="-180" y1="30" x2="-80" y2="30" stroke="${p.muted}" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 15"/>
    </g>

    <g transform="translate(1260, 500)">
      <circle cx="0" cy="0" r="200" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-25" y="-235" width="50" height="35" rx="8" fill="${p.outline}"/>
      <circle cx="0" cy="0" r="160" fill="none" stroke="${p.outline}" stroke-width="4" stroke-dasharray="8 23"/>
      <line x1="0" y1="0" x2="0" y2="-130" stroke="${p.danger}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="14" fill="${p.outline}"/>
      <text x="0" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="70" fill="${p.primary}" text-anchor="middle">60 GIÂY</text>
      <text x="0" y="130" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="28" fill="${p.secondary}" text-anchor="middle">80% DOANH THU</text>
    </g>
  `;
}

function renderLaptopTech(p, sw) {
  return `
    <g transform="translate(680, 540)">
      <ellipse cx="60" cy="270" rx="280" ry="24" fill="${p.outline}" opacity="0.08" />
      <rect x="-80" y="100" width="300" height="20" rx="10" fill="${p.outline}"/>
      <line x1="70" y1="120" x2="70" y2="270" stroke="${p.outline}" stroke-width="8"/>
      <g transform="translate(180, 70)">
        <path d="M -15 -20 L 15 -20 L 10 20 L -10 20 Z" fill="#D97706" stroke="${p.outline}" stroke-width="3"/>
      </g>
      <g transform="translate(30, 95)">
        <line x1="-60" y1="0" x2="60" y2="0" stroke="${p.outline}" stroke-width="7" stroke-linecap="round"/>
        <path d="M -50 0 L -20 -85 L 70 -85 L 40 0 Z" fill="${p.primary}" stroke="${p.outline}" stroke-width="5"/>
        <circle cx="25" cy="-42" r="8" fill="#FFFFFF"/>
      </g>
      <path d="M 40 85 Q -30 160 -180 180 L -240 180" fill="none" stroke="${p.danger}" stroke-width="6" stroke-linecap="round"/>
      <g transform="translate(-250, 180)">
        <rect x="-30" y="-30" width="60" height="60" rx="12" fill="${p.card}" stroke="${p.outline}" stroke-width="5"/>
        <circle cx="-10" cy="0" r="5" fill="${p.outline}"/>
        <circle cx="10" cy="0" r="5" fill="${p.outline}"/>
        <path d="M 0 -35 L -10 -55 L 5 -55 L -5 -75" fill="none" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/>
      </g>
      <circle cx="-130" cy="-30" r="60" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
      <circle cx="-110" cy="-35" r="7" fill="${p.outline}"/>
      <path d="M -125 -15 Q -110 -5 -95 -15" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
      <line x1="-130" y1="30" x2="-140" y2="180" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
      <path d="M -140 180 L -50 180 L -40 270" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M -130 70 L -30 90 L 10 90" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
    </g>

    <g transform="translate(1360, 500)">
      <circle cx="0" cy="0" r="210" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="0" r="170" fill="none" stroke="${p.outline}" stroke-width="4" stroke-dasharray="10 20"/>
      <line x1="0" y1="0" x2="0" y2="-110" stroke="${p.outline}" stroke-width="8" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="0" y2="90" stroke="${p.danger}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="16" fill="${p.danger}"/>
      <text x="0" y="270" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" fill="${p.danger}" text-anchor="middle">NGỒI SUỐT 6 TIẾNG</text>
      <text x="0" y="320" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="26" fill="${p.muted}" text-anchor="middle">Hao mòn điện &amp; mặt bằng</text>
    </g>
  `;
}

function renderCoffeeStorefront(p, sw) {
  return `
    <g transform="translate(580, 520)">
      <rect x="-180" y="-180" width="360" height="360" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-140" y="-140" width="280" height="70" rx="14" fill="${p.outline}"/>
      <circle cx="-60" cy="-105" r="16" fill="${p.accent}"/>
      <circle cx="60" cy="-105" r="16" fill="${p.secondary}"/>
      <rect x="-80" y="-40" width="40" height="60" rx="10" fill="${p.muted}" stroke="${p.outline}" stroke-width="5"/>
      <rect x="40" y="-40" width="40" height="60" rx="10" fill="${p.muted}" stroke="${p.outline}" stroke-width="5"/>
      <path d="M -60 20 L -60 70 M 60 20 L 60 70" stroke="#78350F" stroke-width="6" stroke-linecap="round"/>
      <text x="0" y="240" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">MÁY PHA ESPRESSO</text>
    </g>

    <g transform="translate(1320, 520)">
      <rect x="-200" y="-200" width="400" height="400" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <path d="M -180 -120 L 180 -120 L 150 -50 L -150 -50 Z" fill="${p.danger}" stroke="${p.outline}" stroke-width="6"/>
      <rect x="-130" y="-40" width="260" height="180" rx="16" fill="${p.background}" stroke="${p.outline}" stroke-width="5"/>
      <text x="0" y="50" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" fill="${p.danger}" text-anchor="middle">TIỀN MẶT BẰNG</text>
      <text x="0" y="100" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.muted}" text-anchor="middle">Vị trí đắc địa</text>
    </g>
  `;
}

function renderShoppingDopamine(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-580" y="-270" width="1160" height="540" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <g transform="translate(-270, 0)">
        <ellipse cx="0" cy="180" rx="140" ry="20" fill="${p.outline}" opacity="0.08"/>
        <path d="M -70 -60 Q -110 -20 -90 40 Q -80 80 0 80 Q 80 80 90 40 Q 110 -20 70 -60 Q 60 -110 0 -110 Q -60 -110 -70 -60 Z" fill="#FDF2F8" stroke="#DB2777" stroke-width="7"/>
        <path d="M -40 -30 Q 0 -60 40 -30 Q 0 0 -40 30 Q 0 60 40 30" fill="none" stroke="#F43F5E" stroke-width="5" stroke-linecap="round"/>
        <g transform="translate(-100, -80)">
          <circle cx="0" cy="0" r="14" fill="${p.accent}" stroke="${p.outline}" stroke-width="4"/>
          <text x="0" y="5" font-family="sans-serif" font-weight="900" font-size="12" fill="${p.outline}" text-anchor="middle">+</text>
        </g>
        <g transform="translate(100, -70)">
          <circle cx="0" cy="0" r="18" fill="${p.purple}" stroke="${p.outline}" stroke-width="4"/>
        </g>
        <text x="0" y="140" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="30" fill="#DB2777" text-anchor="middle">DOPAMINE BÙNG NỔ</text>
      </g>
      <g transform="translate(10, -20)">
        <path d="M -40 0 L 0 -40 L -10 0 L 30 -40" fill="none" stroke="${p.accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g transform="translate(290, 0)">
        <rect x="-140" y="-190" width="280" height="380" rx="36" fill="${p.background}" stroke="${p.outline}" stroke-width="${sw}"/>
        <rect x="-100" y="-150" width="200" height="40" rx="10" fill="${p.card}" stroke="${p.outline}" stroke-width="3"/>
        <text x="0" y="-124" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="16" fill="${p.primary}" text-anchor="middle">GIỎ HÀNG ONLINE</text>
        <g transform="translate(0, -30)">
          <circle cx="-35" cy="40" r="12" fill="${p.outline}"/>
          <circle cx="35" cy="40" r="12" fill="${p.outline}"/>
          <path d="M -60 -20 L -45 -20 L -25 25 L 45 25 L 60 -15 L -35 -15" fill="none" stroke="${p.outline}" stroke-width="6" stroke-linecap="round"/>
          <rect x="-20" y="-5" width="25" height="25" rx="4" fill="${p.accent}" stroke="${p.outline}" stroke-width="3"/>
          <rect x="10" y="-15" width="30" height="35" rx="4" fill="${p.danger}" stroke="${p.outline}" stroke-width="3"/>
        </g>
        <g transform="translate(0, 110)">
          <rect x="-105" y="-28" width="210" height="56" rx="16" fill="${p.secondary}" stroke="${p.outline}" stroke-width="4"/>
          <text x="0" y="8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle">BẤM MUA NGAY</text>
        </g>
      </g>
    </g>
  `;
}

function renderTechCode(p, sw) {
  return `
    <g transform="translate(960, 540)">
      <rect x="-560" y="-270" width="1120" height="540" rx="36" fill="#0F172A" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-560" y="-270" width="1120" height="55" rx="36" fill="#1E293B"/>
      <circle cx="-520" cy="-242" r="8" fill="#EF4444"/>
      <circle cx="-495" cy="-242" r="8" fill="#F59E0B"/>
      <circle cx="-470" cy="-242" r="8" fill="#10B981"/>
      <text x="0" y="-233" font-family="monospace" font-weight="700" font-size="18" fill="#94A3B8" text-anchor="middle">algorithm_engine.py</text>
      <g transform="translate(-500, -160)" font-family="monospace" font-weight="700" font-size="24">
        <text x="0" y="0" fill="#F43F5E">def</text>
        <text x="55" y="0" fill="#38BDF8">optimize_business_model</text>
        <text x="400" y="0" fill="#F8FAFC">(data):</text>
        <text x="40" y="45" fill="#94A3B8"># Tính toán điểm hòa vốn và dòng tiền</text>
        <text x="40" y="90" fill="#F8FAFC">margin = data.revenue - data.fixed_costs</text>
        <text x="40" y="135" fill="#F43F5E">if</text>
        <text x="80" y="135" fill="#F8FAFC">margin &gt; 0:</text>
        <text x="80" y="180" fill="#10B981">return "SCALING_EXPONENTIALLY"</text>
      </g>
      <g transform="translate(340, 60)">
        <rect x="-140" y="-140" width="280" height="280" rx="32" fill="#1E293B" stroke="${p.primary}" stroke-width="6"/>
        <circle cx="0" cy="-20" r="55" fill="${p.card}" stroke="${p.primary}" stroke-width="6"/>
        <circle cx="-20" cy="-25" r="8" fill="${p.primary}"/>
        <circle cx="20" cy="-25" r="8" fill="${p.primary}"/>
        <path d="M -15 0 Q 0 15 15 0" stroke="${p.primary}" stroke-width="5" stroke-linecap="round"/>
        <text x="0" y="85" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="#38BDF8" text-anchor="middle">AI OPTIMIZED</text>
      </g>
    </g>
  `;
}

function renderAllocationJars(p, sw) {
  return `
    <g transform="translate(960, 560)">
      <g transform="translate(-460, -180)">
        <rect x="0" y="0" width="280" height="380" rx="32" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="25" y="150" width="230" height="205" rx="20" fill="#DBEAFE" stroke="${p.primary}" stroke-width="4"/>
        <circle cx="140" cy="-20" r="40" fill="${p.primary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="140" y="-8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">50%</text>
        <text x="140" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">THIẾT YẾU</text>
      </g>
      <g transform="translate(-140, -140)">
        <rect x="0" y="0" width="280" height="340" rx="32" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="25" y="170" width="230" height="145" rx="20" fill="#FEF3C7" stroke="${p.accent}" stroke-width="4"/>
        <circle cx="140" cy="-20" r="40" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <text x="140" y="-8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">30%</text>
        <text x="140" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">SỞ THÍCH</text>
      </g>
      <g transform="translate(180, -100)">
        <rect x="0" y="0" width="280" height="300" rx="32" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
        <rect x="25" y="170" width="230" height="105" rx="20" fill="#DCFCE7" stroke="${p.secondary}" stroke-width="4"/>
        <circle cx="140" cy="-20" r="40" fill="${p.secondary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="140" y="-8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">20%</text>
        <text x="140" y="80" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="${p.outline}" text-anchor="middle">TỰ DO</text>
      </g>
    </g>
  `;
}

function renderCompoundingGrowth(p, sw) {
  return `
    <g transform="translate(960, 560)">
      <rect x="-640" y="-300" width="1280" height="580" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <line x1="-540" y1="180" x2="540" y2="180" stroke="${p.outline}" stroke-width="6"/>
      <line x1="-540" y1="180" x2="-540" y2="-200" stroke="${p.outline}" stroke-width="6"/>
      <path d="M -540 160 Q 0 150 200 40 T 480 -180" fill="none" stroke="${p.secondary}" stroke-width="14" stroke-linecap="round"/>
      <g transform="translate(190, 40)">
        <line x1="0" y1="0" x2="0" y2="140" stroke="${p.accent}" stroke-width="4" stroke-dasharray="8 8"/>
        <circle cx="0" cy="0" r="22" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <rect x="-65" y="-70" width="130" height="45" rx="12" fill="${p.accent}" stroke="${p.outline}" stroke-width="4"/>
        <text x="0" y="-40" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.outline}" text-anchor="middle">TUỔI 50</text>
      </g>
      <g transform="translate(480, -180)">
        <circle cx="0" cy="0" r="30" fill="${p.secondary}" stroke="${p.outline}" stroke-width="6"/>
        <rect x="-140" y="-80" width="280" height="65" rx="16" fill="${p.secondary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="-38" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">80% TÀI SẢN</text>
      </g>
      <text x="0" y="240" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" fill="${p.outline}" text-anchor="middle">
        SỨC MẠNH LÃI KÉP KHI KIÊN TRÌ TÍCH LŨY
      </text>
    </g>
  `;
}

function renderGenericComparison(c, text, plan, p, sw) {
  const parts = text.split(/thay vì|so với|chứ không|ngược lại|đối lập|nhưng/i);
  const leftLabel = escapeXml(parts[0]?.trim().substring(0, 32) || 'LỰA CHỌN A');
  const rightLabel = escapeXml(parts[1]?.trim().substring(0, 32) || 'LỰA CHỌN B');

  return `
    <g transform="translate(960, 560)">
      <g transform="translate(-460, -250)">
        <rect x="0" y="0" width="410" height="500" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="30" y="30" width="350" height="75" rx="18" fill="#FEE2E2" stroke="${p.danger}" stroke-width="4"/>
        <text x="205" y="78" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.danger}" text-anchor="middle">${leftLabel}</text>
        <circle cx="205" cy="240" r="70" fill="#FEF2F2" stroke="${p.danger}" stroke-width="5"/>
        <path d="M 180 215 L 230 265 M 230 215 L 180 265" stroke="${p.danger}" stroke-width="10" stroke-linecap="round"/>
      </g>
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="50" fill="${p.accent}" stroke="${p.outline}" stroke-width="${sw}"/>
        <text x="0" y="14" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="34" fill="${p.outline}" text-anchor="middle">VS</text>
      </g>
      <g transform="translate(50, -250)">
        <rect x="0" y="0" width="410" height="500" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <rect x="30" y="30" width="350" height="75" rx="18" fill="#DCFCE7" stroke="${p.secondary}" stroke-width="4"/>
        <text x="205" y="78" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="${p.secondary}" text-anchor="middle">${rightLabel}</text>
        <circle cx="205" cy="240" r="70" fill="#F0FDF4" stroke="${p.secondary}" stroke-width="5"/>
        <path d="M 175 240 L 195 265 L 235 215" fill="none" stroke="${p.secondary}" stroke-width="10" stroke-linecap="round"/>
      </g>
    </g>
  `;
}

function renderGenericNumbers(c, text, plan, p, sw) {
  const metric = escapeXml(c.percentage || c.money || c.time || plan.keyText || '100%');

  return `
    <g transform="translate(960, 540)">
      <rect x="-500" y="-260" width="1000" height="520" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="-20" r="160" fill="none" stroke="${p.primary}" stroke-width="18" stroke-dasharray="750" stroke-dashoffset="150" stroke-linecap="round"/>
      <text x="0" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="120" fill="${p.primary}" letter-spacing="-3" text-anchor="middle">
        ${metric}
      </text>
      <text x="0" y="160" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="32" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(text.substring(0, 60))}
      </text>
    </g>
  `;
}

function renderGenericProcess(c, text, plan, p, sw) {
  const label1 = escapeXml(c.time || '01 BẮT ĐẦU');
  const label2 = escapeXml(plan.keyText || '02 TRIỂN KHAI');
  const label3 = '03 KẾT QUẢ';

  return `
    <g transform="translate(960, 560)">
      <line x1="-500" y1="0" x2="500" y2="0" stroke="${p.outline}" stroke-width="${sw}" stroke-dasharray="16 12"/>
      <g transform="translate(-560, -180)">
        <rect x="0" y="0" width="320" height="360" rx="28" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <circle cx="160" cy="-20" r="40" fill="${p.primary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">01</text>
        <text x="160" y="100" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">${label1}</text>
      </g>
      <g transform="translate(-160, -210)">
        <rect x="0" y="0" width="320" height="390" rx="28" fill="${p.card}" stroke="${p.secondary}" stroke-width="${sw + 2}" filter="url(#softShadow)"/>
        <circle cx="160" cy="-20" r="45" fill="${p.secondary}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-6" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">02</text>
        <text x="160" y="110" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.secondary}" text-anchor="middle">${label2}</text>
      </g>
      <g transform="translate(240, -180)">
        <rect x="0" y="0" width="320" height="360" rx="28" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#cardShadow)"/>
        <circle cx="160" cy="-20" r="40" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <text x="160" y="-8" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">03</text>
        <text x="160" y="100" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="24" fill="${p.outline}" text-anchor="middle">${label3}</text>
      </g>
    </g>
  `;
}

function renderGenericTypography(c, text, plan, p, sw) {
  const badgeLabel = escapeXml(plan.keyText || 'ĐIỂM CỐT LÕI');
  return `
    <g transform="translate(960, 550)">
      <rect x="-580" y="-240" width="1160" height="480" rx="40" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <text x="-500" y="-100" font-family="Georgia, serif" font-weight="900" font-size="160" fill="${p.accent}" opacity="0.4">“</text>
      <text x="0" y="20" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="44" fill="${p.outline}" text-anchor="middle" letter-spacing="-0.5">
        ${escapeXml(text.length > 60 ? text.substring(0, 57) + '...' : text)}
      </text>
      <g transform="translate(0, 140)">
        <rect x="-200" y="-28" width="400" height="56" rx="28" fill="${p.secondary}" stroke="${p.outline}" stroke-width="4"/>
        <text x="0" y="9" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="22" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          ${badgeLabel}
        </text>
      </g>
    </g>
  `;
}

function renderGenericMetaphor(c, text, plan, p, sw) {
  return `
    <g transform="translate(960, 540)">
      <circle cx="0" cy="0" r="220" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <circle cx="0" cy="0" r="160" fill="none" stroke="${p.danger}" stroke-width="8"/>
      <circle cx="0" cy="0" r="100" fill="none" stroke="${p.danger}" stroke-width="8"/>
      <circle cx="0" cy="0" r="40" fill="${p.danger}" stroke="${p.outline}" stroke-width="5"/>
      <path d="M 0 0 L 140 -140" stroke="${p.outline}" stroke-width="10" stroke-linecap="round"/>
      <polygon points="140,-140 120,-115 165,-120" fill="${p.accent}"/>
      <text x="0" y="290" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="38" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(plan.keyText || 'MỤC TIÊU TRỌNG TÂM')}
      </text>
    </g>
  `;
}

function renderGenericCharacter(c, text, plan, p, sw) {
  const mainTitle = escapeXml(plan.keyText || 'TRỌNG TÂM LUẬN ĐIỂM');
  const subAction = escapeXml(plan.action ? plan.action.substring(0, 55) : 'Khám phá và diễn giải chi tiết vấn đề');

  return `
    <g transform="translate(620, 540)">
      <ellipse cx="0" cy="280" rx="160" ry="24" fill="${p.outline}" opacity="0.08" />
      <circle cx="0" cy="-60" r="65" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
      <circle cx="20" cy="-65" r="7" fill="${p.outline}"/>
      <path d="M 10 -40 Q 25 -30 40 -45" fill="none" stroke="${p.outline}" stroke-width="5" stroke-linecap="round"/>
      <line x1="0" y1="5" x2="0" y2="180" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
      <path d="M 0 180 L -70 280 M 0 180 L 70 280" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <path d="M 0 50 L 100 0 L 220 -40" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <circle cx="220" cy="-40" r="8" fill="${p.danger}"/>
    </g>

    <g transform="translate(1300, 480)">
      <rect x="-300" y="-200" width="600" height="400" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-260" y="-160" width="520" height="80" rx="16" fill="${p.background}" stroke="${p.outline}" stroke-width="4"/>
      <text x="0" y="-110" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="32" fill="${p.primary}" text-anchor="middle">
        ${mainTitle}
      </text>
      <line x1="-220" y1="-30" x2="220" y2="-30" stroke="${p.outline}" stroke-width="4" stroke-dasharray="8 8"/>
      <text x="0" y="35" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(text.length > 55 ? text.substring(0, 52) + '...' : text)}
      </text>
      <text x="0" y="95" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.muted}" text-anchor="middle">
        ${subAction}
      </text>
    </g>
  `;
}

// ==================== CULINARY / FOOD VECTOR RENDERERS ====================

function renderCookingBrothPot(p, sw, keyText) {
  return `
    <g transform="translate(960, 560)">
      <rect x="-600" y="-280" width="1200" height="560" rx="44" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <!-- Steaming Stockpot -->
      <g transform="translate(0, 40)">
        <ellipse cx="0" cy="180" rx="200" ry="25" fill="${p.outline}" opacity="0.1"/>
        <path d="M -160 30 L -140 180 Q 0 210 140 180 L 160 30 Z" fill="#334155" stroke="${p.outline}" stroke-width="${sw}"/>
        <ellipse cx="0" cy="30" rx="160" ry="30" fill="#F59E0B" stroke="${p.outline}" stroke-width="${sw}"/>
        <path d="M -180 60 L -160 60 M 160 60 L 180 60" stroke="${p.outline}" stroke-width="12" stroke-linecap="round"/>
        <!-- Rising Steam -->
        <path d="M -60 -10 Q -90 -60 -50 -110 Q -20 -150 -60 -190" fill="none" stroke="#CBD5E1" stroke-width="8" stroke-linecap="round"/>
        <path d="M 0 -20 Q 30 -70 0 -120 Q -30 -160 10 -200" fill="none" stroke="#CBD5E1" stroke-width="10" stroke-linecap="round"/>
        <path d="M 60 -10 Q 90 -60 50 -110 Q 20 -150 70 -190" fill="none" stroke="#CBD5E1" stroke-width="8" stroke-linecap="round"/>
      </g>
      <!-- Hero Badge -->
      <g transform="translate(0, -180)">
        <rect x="-180" y="-35" width="360" height="70" rx="20" fill="${p.accent}" stroke="${p.outline}" stroke-width="5"/>
        <text x="0" y="10" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="32" fill="${p.outline}" text-anchor="middle">
          ${escapeXml(keyText || 'NƯỚC DÙNG NINH')}
        </text>
      </g>
    </g>
  `;
}

function renderCookingChefStickman(p, sw, plan, text) {
  return `
    <g transform="translate(640, 540)">
      <ellipse cx="0" cy="280" rx="150" ry="24" fill="${p.outline}" opacity="0.08"/>
      <!-- Chef Hat -->
      <path d="M -30 -115 L 30 -115 Q 45 -145 20 -165 Q 0 -180 -20 -165 Q -45 -145 -30 -115 Z" fill="#FFFFFF" stroke="${p.outline}" stroke-width="5"/>
      <circle cx="0" cy="-60" r="55" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}"/>
      <circle cx="15" cy="-65" r="6" fill="${p.outline}"/>
      <path d="M 5 -45 Q 20 -35 30 -50" fill="none" stroke="${p.outline}" stroke-width="4" stroke-linecap="round"/>
      <line x1="0" y1="-5" x2="0" y2="180" stroke="${p.outline}" stroke-width="${sw + 2}" stroke-linecap="round"/>
      <path d="M 0 180 L -60 280 M 0 180 L 60 280" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <!-- Chef Hands holding ladle -->
      <path d="M 0 40 L 80 80 L 140 40" fill="none" stroke="${p.outline}" stroke-width="${sw}" stroke-linecap="round"/>
      <circle cx="150" cy="35" r="18" fill="#F59E0B" stroke="${p.outline}" stroke-width="4"/>
    </g>

    <g transform="translate(1320, 500)">
      <rect x="-300" y="-200" width="600" height="400" rx="36" fill="${p.card}" stroke="${p.outline}" stroke-width="${sw}" filter="url(#softShadow)"/>
      <rect x="-260" y="-160" width="520" height="75" rx="16" fill="#FEF3C7" stroke="${p.accent}" stroke-width="4"/>
      <text x="0" y="-112" font-family="'Be Vietnam Pro', sans-serif" font-weight="900" font-size="30" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(plan?.keyText || 'CÔNG THỨC MÓN ĂN')}
      </text>
      <line x1="-220" y1="-35" x2="220" y2="-35" stroke="${p.outline}" stroke-width="4" stroke-dasharray="8 8"/>
      <text x="0" y="30" font-family="'Be Vietnam Pro', sans-serif" font-weight="800" font-size="24" fill="${p.outline}" text-anchor="middle">
        ${escapeXml(text.length > 55 ? text.substring(0, 52) + '...' : text)}
      </text>
      <text x="0" y="90" font-family="'Be Vietnam Pro', sans-serif" font-weight="700" font-size="18" fill="${p.secondary}" text-anchor="middle">
        Tỉ mỉ trong từng hương vị truyền thống
      </text>
    </g>
  `;
}

/**
 * Quality Gate
 */
function runProjectQualityGate(scenes) {
  const issues = [];
  let totalBeats = 0;
  let totalDurationSec = 0;

  for (const scene of scenes) {
    const beats = scene.beats || [];
    totalBeats += beats.length;

    if (beats.length < 2) {
      issues.push(`Cảnh ${scene.id} chỉ có ${beats.length} beat (yêu cầu tối thiểu 2 beats).`);
    }

    for (const beat of beats) {
      totalDurationSec += beat.duration_in_seconds;
      if (beat.duration_in_seconds > 4.5) {
        issues.push(`Beat ${beat.id} dài ${beat.duration_in_seconds}s (quá mục tiêu tối đa 3.5s - 4.0s).`);
      }
    }
  }

  const avgDuration = totalBeats > 0 ? Number((totalDurationSec / totalBeats).toFixed(2)) : 0;
  const passed = issues.length === 0;

  return {
    total_beats: totalBeats,
    avg_beat_duration_sec: avgDuration,
    validation_passed: passed,
    issues,
  };
}

module.exports = {
  createVideoStyleGuide,
  extractSemanticConcepts,
  segmentSceneIntoBeats,
  createLocalBeatPlan,
  planVisualBeatsWithAI,
  validateVisualBeat,
  generateSemanticSvgForBeat,
  runProjectQualityGate,
};
