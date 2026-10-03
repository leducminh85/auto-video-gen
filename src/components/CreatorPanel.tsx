import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Mic,
  Gauge,
  FileText,
  Upload,
  Volume2,
  VolumeX,
  Zap,
  AlertCircle,
  X,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Check,
  Layers,
  Film,
  Image as ImageIcon,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VoiceOption, SceneData, VideoMetadata } from '../types/scenes';
import { buildMultiBeatScenes } from '../utils/stickmanArtGenerator';
import { audioPreviewManager, SAMPLE_PHRASES } from '../utils/audioPreview';

export interface PipelineStepDef {
  key: string;
  number: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
}

export const PIPELINE_STEPS: PipelineStepDef[] = [
  {
    key: 'storyboard',
    number: 1,
    title: 'Phân tích Kịch bản & Cấu trúc Phân cảnh',
    desc: 'Bóc tách nội dung, xây dựng cấu trúc visual explainer và dàn ý cảnh',
    icon: FileText,
  },
  {
    key: 'tts',
    number: 2,
    title: 'Tổng hợp Giọng đọc AI (Voiceover)',
    desc: 'Thu âm giọng đọc Neural, chuẩn hóa cao độ & đo thời lượng từng cảnh',
    icon: Mic,
  },
  {
    key: 'beat_plan',
    number: 3,
    title: 'Lập Kế hoạch Nhịp Thị Giác (Visual Beats)',
    desc: 'Chia nhỏ 2–4 nhịp/cảnh, xác định hành động nhân vật & ẩn dụ trực quan',
    icon: Layers,
  },
  {
    key: 'images',
    number: 4,
    title: 'Tạo Hình ảnh Minh họa Đa dạng',
    desc: 'Sinh hình 1080p theo kịch bản (Local FLUX.1 M4 / DALL-E 3 / Vector Art)',
    icon: ImageIcon,
  },
  {
    key: 'render',
    number: 5,
    title: 'Dựng Chuyển động & Xuất Video MP4',
    desc: 'Hiệu ứng Ken-Burns zoom/pan mượt mà, đồng bộ lồng tiếng Remotion',
    icon: Film,
  },
];

const STEP_ORDER = ['storyboard', 'tts', 'beat_plan', 'images', 'render', 'done'];

export const VOICE_OPTIONS: VoiceOption[] = [
  // Tiếng Việt
  {
    id: 'vi-VN-Standard-A',
    name: 'Nữ Miền Bắc',
    region: 'Bắc',
    gender: 'female',
    tag: 'Truyền Cảm',
    description: 'Giọng đọc chuẩn phóng sự tài liệu, truyền cảm, rõ từng âm tiết.',
  },
  {
    id: 'vi-VN-Standard-B',
    name: 'Nam Miền Bắc',
    region: 'Bắc',
    gender: 'male',
    tag: 'Trầm Ấm',
    description: 'Giọng đọc chuyên gia kinh tế, tự tin, độ vang tốt.',
  },
  {
    id: 'vi-VN-Standard-C',
    name: 'Nữ Miền Nam',
    region: 'Nam',
    gender: 'female',
    tag: 'Năng Động',
    description: 'Giọng đọc trẻ trung, hiện đại, thích hợp video giải thích nhanh.',
  },
  {
    id: 'vi-VN-Standard-D',
    name: 'Nam Miền Nam',
    region: 'Nam',
    gender: 'male',
    tag: 'Uy Tín',
    description: 'Giọng đọc doanh nhân chững chạc, lôi cuốn người nghe.',
  },
  {
    id: 'vi-VN-Studio-AI',
    name: 'AI Studio',
    region: 'AI Studio',
    gender: 'female',
    tag: 'Điện Ảnh',
    description: 'Tổng hợp giọng đọc AI chất lượng cao với ngữ điệu tự nhiên.',
  },
  {
    id: 'vi-VN-Nam-Deep',
    name: 'Nam Điện Ảnh',
    region: 'Toàn quốc',
    gender: 'male',
    tag: 'Sâu Lắng',
    description: 'Tông trầm điện ảnh, mang phong cách phim tài liệu sâu sắc.',
  },
  {
    id: 'vi-VN-Nu-Warm',
    name: 'Nữ Ấm Áp',
    region: 'Toàn quốc',
    gender: 'female',
    tag: 'Tâm Sự',
    description: 'Giọng nữ ấm áp, thích hợp cho chủ đề tài chính và bài học cuộc sống.',
  },
  {
    id: 'vi-VN-Nam-Tech',
    name: 'Nam Công Nghệ',
    region: 'Toàn quốc',
    gender: 'male',
    tag: 'Dứt Khoát',
    description: 'Giọng nam công nghệ dứt khoát, chuyên biệt cho video explainer.',
  },
  {
    id: 'vi-VN-Nu-Energetic',
    name: 'Nữ Sôi Nổi',
    region: 'Toàn quốc',
    gender: 'female',
    tag: 'Viral Video',
    description: 'Giọng nữ năng động, hào hứng, tạo năng lượng tích cực cho video ngắn.',
  },
  // English / Global Voices
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US Explainer)',
    region: 'US',
    gender: 'male',
    tag: 'Vox Style',
    description: 'Giọng nam Mỹ chuẩn phóng sự giải thích khoa học và tài chính.',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US Story)',
    region: 'US',
    gender: 'female',
    tag: 'Thân Thiện',
    description: 'Giọng nữ Mỹ tự nhiên, thân thiện và gần gũi.',
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (US Doc)',
    region: 'US',
    gender: 'female',
    tag: 'Tự Tin',
    description: 'Giọng nữ Mỹ phong thái phim tài liệu National Geographic.',
  },
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher (US)',
    region: 'US',
    gender: 'male',
    tag: 'Kể Chuyện',
    description: 'Giọng nam Mỹ tự sự giàu cảm xúc và lôi cuốn.',
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (British)',
    region: 'UK',
    gender: 'male',
    tag: 'Quý Tộc',
    description: 'Giọng Anh-Anh lịch lãm, phong thái học thuật và sang trọng.',
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (British)',
    region: 'UK',
    gender: 'female',
    tag: 'BBC Doc',
    description: 'Giọng nữ Anh-Anh chuẩn đài BBC, rõ ràng và cuốn hút.',
  },
];

export const SPEED_PRESETS = [
  { value: 0.75, label: '0.75×', desc: 'Chậm' },
  { value: 0.9, label: '0.9×', desc: 'Khoan thai' },
  { value: 1.0, label: '1.0×', desc: 'Chuẩn' },
  { value: 1.15, label: '1.15×', desc: 'Shorts' },
  { value: 1.25, label: '1.25×', desc: 'Nhanh' },
  { value: 1.5, label: '1.5×', desc: 'Siêu tốc' },
];

export const SAMPLE_SCRIPTS = [
  {
    id: 'gym',
    title: 'Kinh Tế Học Phòng Gym',
    subtitle: 'The Economics of Opening a Gym',
    content: `CẢNH 1: Ảo Tưởng Giờ Cao Điểm
Đến phòng gym vào giờ cao điểm, thấy máy chạy bộ kín người, phòng tạ đông đúc và quầy lễ tân xếp hàng, ai cũng nghĩ đây là cỗ máy in tiền béo bở.

CẢNH 2: Bản Chất Mô Hình Thuê Bao
Sự thật bóc trần: Phòng gym không phải kinh doanh thể thao, mà là mô hình thuê bao subscription có chứa tạ và máy móc.

CẢNH 3: Chi Phí Ban Đầu Khổng Lồ
Chi phí mở cửa ban đầu cực kỳ tốn kém, từ 300.000 đến hơn 1 triệu USD chỉ cho tiền cọc, sàn cao su chịu lực, và hệ thống thông gió HVAC khổng lồ.

CẢNH 4: Mua Đứt Hay Thuê Tài Chính?
Mua đứt thiết bị sẽ ngốn sạch dòng tiền dự phòng, còn thuê tài chính thì phải gánh lãi suất 8% và khoản nợ cố định dù phòng gym vắng khách.

CẢNH 5: Quy Tắc 10 Đến 15 Phút
Quy tắc vị trí 10 đến 15 phút: 80% hội viên chỉ đến từ bán kính di chuyển ngắn, nếu chọn sai vị trí hoặc giá thuê quá cao, bạn cầm chắc thất bại.

CẢNH 6: Bí Mật Hội Viên Vô Hình
Bí mật lợi nhuận nằm ở Hội Viên Vô Hình: Người đi tập chăm chỉ làm mòn máy móc và tăng chi phí, còn người đóng tiền rồi lặn mất tăm mới mang lại 100% lợi nhuận ròng.

CẢNH 7: Nghịch Lý Sức Chứa
Nghịch lý sức chứa: Phòng 7.000 hội viên chỉ chứa nổi 200 người; nếu chỉ 10% cùng đến tập một lúc, phòng gym sẽ ngay lập tức vỡ trận và vi phạm phòng cháy chữa cháy.

CẢNH 8: Cú Lừa Tháng Một
Cú lừa tháng Một: 12% hội viên đăng ký ồ ạt đầu năm, nhưng 80% sẽ bỏ cuộc trước mùa hè; chủ phòng gym tiêu hết tiền sớm sẽ đối mặt thảm họa cạn vốn.

CẢNH 9: Nhượng Quyền Hay Tự Mở?
Nhượng quyền mang lại thương hiệu nhưng bạn phải nộp 5 đến 10% doanh thu mỗi tháng vĩnh viễn, còn tự mở độc lập thì phải tự bơi từ con số không.

CẢNH 10: Rào Cản Hủy Gói Tinh Quái
Rào cản hủy hợp đồng tinh quái: Bắt làm đơn trực tiếp, gửi thư bảo đảm và lợi dụng tâm lý trì hoãn để tiếp tục trừ tiền đều đặn.

CẢNH 11: Các Chi Phí Ẩn Bào Mòn
Các chi phí ẩn bào mòn túi tiền: Bản quyền âm nhạc công cộng lên tới hàng ngàn USD, tiền điện chạy máy lạnh 24/7 và chi phí bảo trì thay cáp liên tục.

CẢNH 12: Bài Học Từ Các Vụ Phá Sản
Bài học từ những vụ phá sản lớn: Sụp đổ không phải vì thiếu khách, mà do nợ xấu phình to và bán hàng chèo kéo ép khách vay nợ dài hạn.

CẢNH 13: Đòn Bẩy PT Nhóm Nhỏ
Đòn bẩy PT: Dạy 1-kèm-1 nhanh chóng chạm trần doanh thu, huấn luyện nhóm nhỏ 4 người mới là vũ khí tối ưu mặt bằng và nhân đôi lợi nhuận.

CẢNH 14: Kết Luận Toàn Bộ Video
Thành công trong kinh doanh phòng gym không nằm ở việc hút bao nhiêu người đăng ký ban đầu, mà phụ thuộc vào việc bạn sống sót tốt đến đâu dựa trên những người trả tiền nhưng không bao giờ đến tập.`,
  },
  {
    id: 'finance',
    title: 'Tâm Lý Học Tài Chính',
    subtitle: 'Psychology of Money',
    content: `CẢNH 1: Bẫy Mua Sắm Theo Cảm Xúc
Bộ não con người giải phóng dopamine khi bấm nút mua hàng, khiến chúng ta nhầm lẫn giữa sự sung sướng tức thời và hạnh phúc thực sự.

CẢNH 2: Hiệu Ứng Lạm Phát Lối Sống
Khi thu nhập tăng từ 15 lên 30 triệu, mức chi tiêu tự động tăng theo; chiếc xe máy đổi thành ô tô và tài khoản tiết kiệm vẫn dậm chân tại chỗ.

CẢNH 3: Sức Mạnh Kỳ Diệu Của Lãi Kép
Đầu tư 2 triệu mỗi tháng với lãi suất 10%/năm từ tuổi 20 sẽ biến thành hơn 7 tỷ đồng khi về hưu nhờ đòn bẩy thời gian.

CẢNH 4: Quy Tắc 50-30-20 Đơn Giản
50% thu nhập cho nhu cầu thiết yếu, 30% cho mong muốn cá nhân, và 20% bắt buộc chuyển ngay vào quỹ tự do tài chính trước khi tiêu.

CẢNH 5: Tự Do Tài Chính Đích Thực
Giàu có không phải là khoe những món đồ xa xỉ bạn có thể mua, mà là có quyền từ chối những điều bạn không muốn làm mỗi sáng thức dậy.`,
  },
  {
    id: 'ai',
    title: 'AI Thay Đổi Thế Giới',
    subtitle: 'How AI Reshapes Society',
    content: `CẢNH 1: Cuộc Cách Mạng Trí Tuệ Nhân Tạo
AI không chỉ là công nghệ của tương lai, mà đang âm thầm tái định hình mọi ngóc ngách từ giáo dục, y tế đến nghệ thuật sáng tạo.

CẢNH 2: Từ Tự Động Hóa Đến Sáng Tạo Đột Phá
Trước đây máy tính chỉ tính toán số liệu, ngày nay các mô hình ngôn ngữ lớn và mô hình thị giác có thể vẽ tranh, viết kịch bản và lập trình.

CẢNH 3: Ai Sẽ Bị Thay Thế?
AI không thay thế con người, nhưng người biết sử dụng AI sẽ nhanh chóng vượt lên và thay thế những ai từ chối làm quen với nó.

CẢNH 4: Đòn Bẩy Năng Suất Cá Nhân
Một cá nhân đơn lẻ ngày nay với sự trợ giúp của AI có thể hoàn thành khối lượng công việc từng cần cả một đội ngũ mười người.

CẢNH 5: Tương Lai Trong Tầm Tay
Học cách đặt câu hỏi thông minh, tư duy phản biện và làm chủ công cụ mới chính là chiếc chìa khóa vàng cho kỷ nguyên số.`,
  },
];

interface CreatorPanelProps {
  currentScenes: SceneData[];
  onGenerateNewVideo: (newScenes: SceneData[], metadata: VideoMetadata) => void;
  onCancel?: () => void;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({
  currentScenes,
  onGenerateNewVideo,
  onCancel,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<string>('vi-VN-Standard-A');
  const [speed, setSpeed] = useState<number>(1.0);
  const [contentMode, setContentMode] = useState<'text' | 'file'>('text');
  const [textContent, setTextContent] = useState<string>(SAMPLE_SCRIPTS[0].content);
  const [scriptTitle, setScriptTitle] = useState<string>(SAMPLE_SCRIPTS[0].title);
  const [scriptSubtitle, setScriptSubtitle] = useState<string>(SAMPLE_SCRIPTS[0].subtitle);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepKey, setCurrentStepKey] = useState<string>('storyboard');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [progressDetails, setProgressDetails] = useState<Record<string, any>>({});
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [creationSuccess, setCreationSuccess] = useState<boolean>(false);
  const [showTerminalLogs, setShowTerminalLogs] = useState<boolean>(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || '';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { audioPreviewManager.stop(); };
  }, []);

  useEffect(() => {
    if (showTerminalLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [creationLogs, showTerminalLogs]);

  const handleTogglePlayVoice = (voice: VoiceOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingVoiceId === voice.id) {
      audioPreviewManager.stop();
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(voice.id);
    setSelectedVoice(voice.id);
    audioPreviewManager.playVoicePreview(
      voice, speed,
      () => setPlayingVoiceId(null),
      () => setPlayingVoiceId(null)
    );
  };

  const handleSelectPreset = (preset: typeof SAMPLE_SCRIPTS[0]) => {
    setTextContent(preset.content);
    setScriptTitle(preset.title);
    setScriptSubtitle(preset.subtitle);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const trimmed = text.trim();
        // Check if JSON
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.metadata?.title) {
              setScriptTitle(parsed.metadata.title);
            } else {
              setScriptTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
            if (parsed.metadata?.subtitle) {
              setScriptSubtitle(parsed.metadata.subtitle);
            }
            const scenesList = Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.data || []);
            if (Array.isArray(scenesList) && scenesList.length > 0) {
              const formatted = scenesList
                .map((s: any, idx: number) =>
                  `CẢNH ${idx + 1}: ${s.title || `Cảnh ${idx + 1}`}\n${s.narration || s.text || s.caption || ''}`
                )
                .join('\n\n');
              setTextContent(formatted);
              return;
            }
          } catch (_) {}
        }

        setTextContent(text);
        setScriptTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const parseContentToScenes = (rawText: string): { title: string; text: string }[] => {
    const trimmed = (rawText || '').trim();
    if (!trimmed) return [];

    // 1. JSON parsing check
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const scenesList = Array.isArray(parsed) ? parsed : (parsed.scenes || parsed.data || []);
        if (Array.isArray(scenesList) && scenesList.length > 0) {
          return scenesList
            .map((s: any, idx: number) => ({
              title: s.title || `Cảnh ${idx + 1}`,
              text: s.narration || s.text || s.caption || '',
            }))
            .filter((s: any) => s.text.length > 0);
        }
      } catch (_) {}
    }

    // 2. Explicit CẢNH / SCENE / # / 1. delimited check
    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: { title: string; text: string }[] = [];
    let currentTitle = '';
    let currentBody: string[] = [];

    const isDelimiter = (line: string) =>
      /^(CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]/i.test(line) ||
      /^#+\s+/i.test(line) ||
      /^\d+[\.\)]\s+[A-ZÀ-Ỹ]/i.test(line);

    for (const line of lines) {
      if (isDelimiter(line)) {
        if (currentTitle && currentBody.length > 0) {
          parsed.push({ title: currentTitle, text: currentBody.join(' ') });
        }
        currentTitle = line
          .replace(/^(CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]\s*/i, '')
          .replace(/^#+\s*/, '')
          .replace(/^\d+[\.\)]\s+/, '')
          .trim();
        currentBody = [];
      } else {
        if (!currentTitle) currentTitle = `Cảnh 1`;
        currentBody.push(line);
      }
    }
    if (currentTitle && currentBody.length > 0) {
      parsed.push({ title: currentTitle, text: currentBody.join(' ') });
    }

    // 3. If only 1 scene resulted, but text has blank line paragraphs or multiple sentences:
    if (parsed.length <= 1) {
      const paragraphs = trimmed
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 10);

      if (paragraphs.length > 1) {
        return paragraphs.map((p, idx) => {
          const firstLine = p.split('\n')[0].replace(/^#+\s*/, '').trim();
          const title = firstLine.length < 35 ? firstLine : `Cảnh ${idx + 1}`;
          const text = p.length > firstLine.length ? p.substring(firstLine.length).trim() : p;
          return { title, text: text || firstLine };
        });
      }

      // 4. Single continuous block with many words -> split by sentences!
      const totalWords = trimmed.split(/\s+/).length;
      if (totalWords > 30) {
        const sentences = trimmed
          .split(/(?<=[.!?;\n])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 5);

        if (sentences.length > 1) {
          const sceneCount = Math.min(6, Math.max(2, Math.ceil(sentences.length / 2)));
          const buckets: string[][] = Array.from({ length: sceneCount }, () => []);
          const baseSize = Math.floor(sentences.length / sceneCount);
          let remainder = sentences.length % sceneCount;
          let idx = 0;
          for (let b = 0; b < sceneCount; b++) {
            const take = baseSize + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
            buckets[b] = sentences.slice(idx, idx + take);
            idx += take;
          }
          return buckets
            .filter((b) => b.length > 0)
            .map((b, sIdx) => ({
              title: `Cảnh ${sIdx + 1}`,
              text: b.join(' '),
            }));
        }
      }
    }

    return parsed;
  };

  const handleCreateVideo = async () => {
    setErrorMessage(null);
    if (!textContent.trim()) {
      setErrorMessage('Vui lòng nhập nội dung kịch bản trước khi bấm Tạo Video');
      return;
    }
    audioPreviewManager.stop();
    setPlayingVoiceId(null);
    setIsCreating(true);
    setCreationSuccess(false);
    setProgressPercent(3);
    setCurrentStepKey('storyboard');
    setCurrentMessage('Đang khởi động tiến trình & chuẩn bị kịch bản...');
    setProgressDetails({});
    setCreationLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Bắt đầu tiến trình tạo video explainer...`,
      `[${new Date().toLocaleTimeString()}] Giọng đọc: ${selectedVoiceObj.name} (${speed}×)`,
    ]);

    const rawParsedScenes = parseContentToScenes(textContent);
    if (rawParsedScenes.length === 0) {
      setErrorMessage('Không nhận diện được phân cảnh nào từ kịch bản.');
      setIsCreating(false);
      return;
    }

    try {
      let effectiveTitle = (scriptTitle || '').trim();
      const isGymPresetTitle = effectiveTitle === 'Kinh Tế Học Phòng Gym';
      const textIsActuallyGym = /gym|phòng tập|thể hình|máy chạy bộ|tạ tay/i.test(textContent);
      if (!effectiveTitle || (isGymPresetTitle && !textIsActuallyGym)) {
        const firstScene = rawParsedScenes[0];
        effectiveTitle = firstScene?.title ? firstScene.title : 'Video Stickman Mới';
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          subtitle: scriptSubtitle || `Giọng đọc ${speed}×`,
          voice: selectedVoice,
          speed,
          content: textContent,
          scenes: rawParsedScenes,
          geminiApiKey: geminiApiKey.trim() || undefined,
          openaiApiKey: openaiApiKey.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Trình duyệt không hỗ trợ đọc phản hồi stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalResultData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === 'progress') {
              if (typeof event.percent === 'number') {
                setProgressPercent(event.percent);
              }
              if (event.stepKey) {
                setCurrentStepKey(event.stepKey);
              }
              if (event.message) {
                setCurrentMessage(event.message);
                setCreationLogs((prev) => [
                  ...prev,
                  `[${event.timestamp || new Date().toLocaleTimeString()}] ${event.message}`,
                ]);
              }
              if (event.details || event.sceneIndex || event.totalScenes) {
                setProgressDetails((prev) => ({
                  ...prev,
                  ...event,
                  ...(event.details || {}),
                }));
              }
            } else if (event.type === 'complete') {
              finalResultData = event.result;
              setProgressPercent(100);
              setCurrentStepKey('done');
              setCreationSuccess(true);
              setCurrentMessage('🎉 Hoàn tất 100%! Đang tải video vào Remotion Player...');
              setCreationLogs((prev) => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] 🎉 Hoàn tất xuất sắc! Video đã sẵn sàng phát.`,
              ]);
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Lỗi trong quá trình tạo video');
            }
          } catch (lineErr: any) {
            if (lineErr.message && !lineErr.message.includes('JSON')) {
              throw lineErr;
            }
          }
        }
      }

      if (!finalResultData || !finalResultData.scenes) {
        throw new Error('Không nhận được dữ liệu phân cảnh từ hệ thống.');
      }

      const multiBeatScenes = buildMultiBeatScenes(finalResultData.scenes);
      await new Promise((r) => setTimeout(r, 700));
      onGenerateNewVideo(multiBeatScenes, finalResultData.metadata);
      setIsCreating(false);
    } catch (err: any) {
      console.error('Error generating video:', err);
      setErrorMessage(err.message || 'Lỗi trong quá trình tạo video. Vui lòng thử lại.');
      setIsCreating(false);
    }
  };

  const currentStepIndex = STEP_ORDER.indexOf(currentStepKey);

  const getStepStatus = (stepKey: string, stepIndex: number) => {
    if (creationSuccess || currentStepKey === 'done') return 'completed';
    const targetIndex = STEP_ORDER.indexOf(stepKey);
    if (targetIndex < currentStepIndex) return 'completed';
    if (targetIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = ((wordCount / 3.2) / speed);
  const selectedVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || VOICE_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: 16, height: 16, color: 'var(--text-inverse)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Tạo Video Mới
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Chọn giọng, tốc độ, nhập kịch bản
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div
          style={{
            margin: '12px 20px 0',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-muted)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--error)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
          {errorMessage}
        </div>
      )}

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Section 1: Voice */}
        <div style={{ marginBottom: 24 }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Mic style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            1. Giọng đọc
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {VOICE_OPTIONS.map((voice) => {
              const isSelected = selectedVoice === voice.id;
              const isPlayingThis = playingVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`card ${isSelected ? 'card-active' : ''}`}
                  style={{ padding: 12, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {voice.gender === 'female' ? '♀' : '♂'} {voice.name}
                    </span>
                    <span className="badge badge-accent" style={{ fontSize: 10 }}>
                      {voice.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {voice.description}
                  </p>
                  <button
                    onClick={(e) => handleTogglePlayVoice(voice, e)}
                    className={`btn ${isPlayingThis ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: '100%', fontSize: 11, padding: '6px 10px' }}
                  >
                    {isPlayingThis ? (
                      <><VolumeX style={{ width: 12, height: 12 }} /> Dừng</>
                    ) : (
                      <><Volume2 style={{ width: 12, height: 12 }} /> Nghe thử ({speed}×)</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Speed */}
        <div style={{ marginBottom: 24 }}>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Gauge style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            2. Tốc độ đọc
            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 700 }}>
              {speed}×
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {SPEED_PRESETS.map((preset) => {
              const isActive = speed === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    setSpeed(preset.value);
                    if (playingVoiceId) {
                      const v = VOICE_OPTIONS.find((vo) => vo.id === playingVoiceId);
                      if (v) {
                        audioPreviewManager.playVoicePreview(v, preset.value, () => setPlayingVoiceId(null), () => setPlayingVoiceId(null));
                      }
                    }
                  }}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <div>{preset.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{preset.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Content */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText style={{ width: 14, height: 14, color: 'var(--accent)' }} />
              3. Kịch bản
            </label>
            <div className="tab-group" style={{ padding: 2 }}>
              <button
                className={`tab-item ${contentMode === 'text' ? 'tab-item-active' : ''}`}
                onClick={() => setContentMode('text')}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                Văn bản
              </button>
              <button
                className={`tab-item ${contentMode === 'file' ? 'tab-item-active' : ''}`}
                onClick={() => setContentMode('file')}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                Tải file
              </button>
            </div>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {SAMPLE_SCRIPTS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`btn ${scriptTitle === preset.title ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 11, padding: '5px 10px' }}
              >
                {preset.title}
              </button>
            ))}
          </div>

          {/* File upload */}
          {contentMode === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: 24,
                border: '2px dashed var(--border-hover)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-base)',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 10,
                transition: 'border-color 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.srt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Upload style={{ width: 24, height: 24, color: 'var(--accent)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {uploadedFileName ? `✓ ${uploadedFileName}` : 'Nhấp để chọn file'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                .txt, .md, .json, .srt
              </p>
            </div>
          )}

          {/* Title & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => { setScriptTitle(e.target.value); setErrorMessage(null); }}
              className="input"
              placeholder="Tiêu đề video"
              style={{ fontWeight: 600 }}
            />
            <input
              type="text"
              value={scriptSubtitle}
              onChange={(e) => setScriptSubtitle(e.target.value)}
              className="input"
              placeholder="Phụ đề"
            />
          </div>

          {/* Textarea */}
          <textarea
            value={textContent}
            onChange={(e) => { setTextContent(e.target.value); setErrorMessage(null); }}
            rows={10}
            className="input"
            style={{
              width: '100%',
              resize: 'vertical',
              lineHeight: 1.6,
              minHeight: 200,
            }}
            placeholder="Nhập kịch bản theo từng CẢNH 1, CẢNH 2..."
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>
              {wordCount} từ · ≈{estimatedSeconds.toFixed(0)}s
            </span>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {showAdvancedSettings ? 'Ẩn cài đặt AI ▲' : '🤖 Tùy chọn Gemini AI ▼'}
            </button>
          </div>

          {/* Advanced Gemini API Key Setting */}
          {showAdvancedSettings && (
            <>
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Gemini API Key (Tùy chọn)
                </label>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Hệ thống tự động tạo ảnh từ nội dung; nhập key nếu muốn AI làm giàu ngữ nghĩa
                </span>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  localStorage.setItem('gemini_api_key', e.target.value);
                }}
                className="input"
                placeholder="AIzaSy..."
                style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}
              />
            </div>
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>🎨 OpenAI API Key (DALL-E 3)</span>
                <span
                  style={{
                    fontSize: 10,
                    color: openaiApiKey ? 'var(--success)' : 'var(--text-muted)',
                    background: openaiApiKey ? 'rgba(34,197,94,0.1)' : 'rgba(100,100,100,0.1)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {openaiApiKey ? '✓ Active — Hand-drawn mode' : 'Không có → SVG fallback'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Nhập key để sinh ảnh Hand-drawn Detailed bằng DALL-E 3. Nếu bỏ trống, hệ thống dùng SVG vector.
              </span>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => {
                  setOpenaiApiKey(e.target.value);
                  localStorage.setItem('openai_api_key', e.target.value);
                }}
                className="input"
                placeholder="sk-..."
                style={{ width: '100%', fontSize: 12, fontFamily: 'monospace' }}
              />
            </div>
            </>
          )}
        </div>
      </div>

      {/* Footer with Create button */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
          background: 'var(--bg-surface)',
        }}
      >
        <button className="btn btn-ghost" onClick={onCancel}>
          Hủy
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCreateVideo}
          disabled={isCreating}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 700,
            opacity: isCreating ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isCreating ? (
            <>
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
              <span>Đang tạo video ({progressPercent}%)...</span>
            </>
          ) : (
            <>
              <Zap style={{ width: 16, height: 16 }} />
              <span>Tạo Video</span>
            </>
          )}
        </button>
      </div>

      {/* Creation Progress Modal & Real-Time Pipeline Checklist */}
      {isCreating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(5, 6, 10, 0.82)',
            backdropFilter: 'blur(12px)',
          }}
          className="animate-fade-in"
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hover)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              maxWidth: 'min(640px, 95vw)',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Top Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-xl)',
                    background: creationSuccess ? 'rgba(52, 211, 153, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                    border: `1px solid ${creationSuccess ? 'var(--success-border)' : 'var(--accent-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: creationSuccess ? '0 0 20px rgba(52, 211, 153, 0.25)' : '0 0 20px rgba(129, 140, 248, 0.25)',
                  }}
                >
                  {creationSuccess ? (
                    <CheckCircle2 style={{ width: 26, height: 26, color: 'var(--success)' }} />
                  ) : (
                    <Zap style={{ width: 24, height: 24, color: 'var(--accent)' }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {creationSuccess ? 'Tạo Video Hoàn Tất!' : 'Đang Tạo Video Explainer'}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: creationSuccess ? 'rgba(52, 211, 153, 0.12)' : 'rgba(129, 140, 248, 0.12)',
                        color: creationSuccess ? 'var(--success)' : 'var(--accent)',
                        border: `1px solid ${creationSuccess ? 'var(--success-border)' : 'var(--accent-border)'}`,
                      }}
                    >
                      {creationSuccess ? 'Thành công' : 'Live Pipeline'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      margin: '4px 0 0',
                      maxWidth: 380,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {creationSuccess
                      ? 'Đã ghép chuyển động Remotion và nạp video vào Player'
                      : currentMessage || 'Hệ thống đang tiến hành xử lý kịch bản...'}
                  </p>
                </div>
              </div>

              {/* Exact Percentage Badge */}
              <div
                style={{
                  textAlign: 'right',
                  padding: '8px 16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  minWidth: 96,
                }}
              >
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Tiến độ
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    color: creationSuccess ? 'var(--success)' : 'var(--accent)',
                  }}
                >
                  {progressPercent}%
                </div>
              </div>
            </div>

            {/* Shimmering Animated Progress Bar */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!creationSuccess && <span className="pulse-dot" />}
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {creationSuccess
                      ? 'Đã hoàn tất 5/5 bước xử lý'
                      : `Bước ${Math.min(5, Math.max(1, currentStepIndex + 1))}/5: ${PIPELINE_STEPS[Math.min(4, Math.max(0, currentStepIndex))]?.title}`}
                  </span>
                </span>
                <span className="mono" style={{ color: creationSuccess ? 'var(--success)' : 'var(--accent)', fontWeight: 700 }}>
                  {progressPercent}%
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: 10,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 99,
                  overflow: 'hidden',
                  padding: 1,
                  position: 'relative',
                }}
              >
                <div
                  className={creationSuccess ? '' : 'progress-striped'}
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: creationSuccess
                      ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                      : 'linear-gradient(90deg, #6366f1 0%, #818cf8 35%, #a855f7 70%, #34d399 100%)',
                    borderRadius: 99,
                    transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: creationSuccess
                      ? '0 0 12px rgba(52, 211, 153, 0.4)'
                      : '0 0 14px rgba(129, 140, 248, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* Checklist: 5 Detailed Pipeline Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {PIPELINE_STEPS.map((step, idx) => {
                const status = getStepStatus(step.key, idx);
                const IconComponent = step.icon;
                const isActive = status === 'active';
                const isCompleted = status === 'completed';

                return (
                  <div
                    key={step.key}
                    className="step-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-lg)',
                      border: isActive
                        ? '1px solid var(--accent-border)'
                        : isCompleted
                        ? '1px solid rgba(52, 211, 153, 0.2)'
                        : '1px solid var(--border)',
                      background: isActive
                        ? 'rgba(129, 140, 248, 0.08)'
                        : isCompleted
                        ? 'rgba(52, 211, 153, 0.04)'
                        : 'var(--bg-input)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {/* Step Indicator Circle */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: isCompleted
                            ? 'rgba(52, 211, 153, 0.15)'
                            : isActive
                            ? 'rgba(129, 140, 248, 0.2)'
                            : 'var(--bg-surface)',
                          border: `1.5px solid ${
                            isCompleted
                              ? 'var(--success)'
                              : isActive
                              ? 'var(--accent)'
                              : 'var(--border)'
                          }`,
                        }}
                      >
                        {isCompleted ? (
                          <Check style={{ width: 14, height: 14, color: 'var(--success)', strokeWidth: 3 }} />
                        ) : isActive ? (
                          <Loader2 style={{ width: 14, height: 14, color: 'var(--accent)' }} className="animate-spin" />
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                            {step.number}
                          </span>
                        )}
                      </div>

                      {/* Step Title & Sub-detail */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                              color: isActive
                                ? 'var(--accent-hover)'
                                : isCompleted
                                ? 'var(--text-primary)'
                                : 'var(--text-secondary)',
                            }}
                          >
                            Bước {step.number}: {step.title}
                          </span>
                        </div>

                        {/* Dynamic Step Status Description */}
                        <div
                          style={{
                            fontSize: 11,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {isActive ? (
                            <span style={{ color: 'var(--accent-hover)', fontWeight: 500 }}>
                              ▶ {currentMessage || step.desc}
                            </span>
                          ) : isCompleted ? (
                            <span style={{ color: 'var(--success)' }}>
                              ✓ Hoàn thành: {step.desc}
                            </span>
                          ) : (
                            <span>{step.desc}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step Status Badge on the Right */}
                    <div style={{ marginLeft: 12, flexShrink: 0 }}>
                      {isCompleted ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--success)',
                            background: 'rgba(52, 211, 153, 0.12)',
                            border: '1px solid var(--success-border)',
                            borderRadius: 99,
                            padding: '3px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Check style={{ width: 10, height: 10, strokeWidth: 3 }} />
                          Xong
                        </span>
                      ) : isActive ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--accent)',
                            background: 'rgba(129, 140, 248, 0.14)',
                            border: '1px solid var(--accent-border)',
                            borderRadius: 99,
                            padding: '3px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span className="pulse-dot" />
                          Đang chạy
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 99,
                            padding: '3px 10px',
                          }}
                        >
                          Chờ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Collapsible Real-Time System Log Terminal */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-input)',
                overflow: 'hidden',
              }}
            >
              <div
                onClick={() => setShowTerminalLogs(!showTerminalLogs)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderBottom: showTerminalLogs ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Nhật ký chi tiết thời gian thực ({creationLogs.length})
                  </span>
                  {creationLogs.length > 0 && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'var(--bg-elevated)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      stream active
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{showTerminalLogs ? 'Thu gọn' : 'Mở rộng'}</span>
                  {showTerminalLogs ? (
                    <ChevronUp style={{ width: 13, height: 13 }} />
                  ) : (
                    <ChevronDown style={{ width: 13, height: 13 }} />
                  )}
                </div>
              </div>

              {showTerminalLogs && (
                <div
                  className="mono"
                  style={{
                    padding: '10px 14px',
                    maxHeight: 120,
                    overflowY: 'auto',
                    fontSize: 11,
                    lineHeight: 1.6,
                    background: '#090a0f',
                  }}
                >
                  {creationLogs.map((log, idx) => {
                    const isLatest = idx === creationLogs.length - 1;
                    return (
                      <div
                        key={idx}
                        style={{
                          color: isLatest ? 'var(--accent-hover)' : 'var(--text-muted)',
                          fontWeight: isLatest ? 600 : 400,
                          display: 'flex',
                          gap: 6,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', opacity: 0.5, flexShrink: 0 }}>›</span>
                        <span style={{ wordBreak: 'break-word' }}>{log}</span>
                      </div>
                    );
                  })}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
