import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Trash2,
  RotateCcw,
  Gauge,
  FileText,
  Upload,
  Volume2,
  VolumeX,
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
import { readCreatorDraft, saveCreatorDraft } from '../utils/creatorDraft';
import { useDialog } from '../utils/useDialog';
import { IconButton } from './IconButton';
import { AudioTimingEditor } from './AudioTimingEditor';
import { defaultPrompt } from '../config/imageStyle.json';

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
    title: 'Chia nội dung thành cảnh',
    desc: 'Xác định nội dung và ý chính cho từng cảnh.',
    icon: FileText,
  },
  {
    key: 'tts',
    number: 2,
    title: 'Chuẩn bị giọng đọc',
    desc: 'Tạo lời đọc và xác định thời lượng.',
    icon: Mic,
  },
  {
    key: 'beat_plan',
    number: 3,
    title: 'Lên ý tưởng cho từng ảnh',
    desc: 'Chia ảnh theo lời đọc, viết và kiểm tra mô tả.',
    icon: Layers,
  },
  {
    key: 'images',
    number: 4,
    title: 'Tạo hình minh họa',
    desc: 'Tạo ảnh theo nội dung và phong cách đã chọn.',
    icon: ImageIcon,
  },
  {
    key: 'render',
    number: 5,
    title: 'Ghép và xuất video',
    desc: 'Ghép ảnh với audio và xuất file MP4.',
    icon: Film,
  },
];

const STEP_ORDER = ['storyboard', 'tts', 'beat_plan', 'images', 'render', 'done'];

export const VOICE_OPTIONS: VoiceOption[] = [
  // Tiếng Việt
  {
    id: 'vi-VN-Standard-B',
    name: 'Nam Minh',
    region: 'Toàn quốc',
    gender: 'male',
    tag: 'Tiếng Việt',
    description: 'Giọng đọc nam rõ ràng, chuẩn phổ thông.',
  },
  {
    id: 'vi-VN-Standard-A',
    name: 'Hoài My',
    region: 'Toàn quốc',
    gender: 'female',
    tag: 'Tiếng Việt',
    description: 'Giọng đọc nữ tự nhiên, chuẩn phổ thông.',
  },
  // English
  {
    id: 'en-US-GuyNeural',
    name: 'Guy',
    region: 'US',
    gender: 'male',
    tag: 'English',
    description: 'Giọng nam tiếng Anh chuẩn phóng sự.',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny',
    region: 'US',
    gender: 'female',
    tag: 'English',
    description: 'Giọng nữ tiếng Anh tự nhiên.',
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
  currentMetadata: VideoMetadata;
  onGenerateNewVideo: (newScenes: SceneData[], metadata: VideoMetadata) => void;
  onCancel: () => void;
}

export const CreatorPanel: React.FC<CreatorPanelProps> = ({
  currentScenes,
  currentMetadata,
  onGenerateNewVideo,
  onCancel,
}) => {
  const [draft] = useState(() => readCreatorDraft({
    voice: currentMetadata.voice || 'vi-VN-Standard-B',
    speed: currentMetadata.speed || 1,
    text: currentScenes.map(scene => scene.text).join('\n\n'),
    title: currentMetadata.title || '',
    subtitle: currentMetadata.subtitle || '',
    imageDensity: currentMetadata.image_density || 'balanced',
    imageStylePrompt: currentMetadata.image_style_prompt || defaultPrompt,
  }));
  const [selectedVoice, setSelectedVoice] = useState<string>(draft.voice);
  const [speed, setSpeed] = useState<number>(draft.speed);
  const [contentMode, setContentMode] = useState<'text' | 'file'>('text');
  const [textContent, setTextContent] = useState<string>(draft.text);
  const [scriptTitle, setScriptTitle] = useState<string>(draft.title);
  const [scriptSubtitle, setScriptSubtitle] = useState<string>(draft.subtitle);
  const [imageDensity, setImageDensity] = useState<'sparse' | 'balanced' | 'dense'>(draft.imageDensity || 'balanced');
  const [imageStylePrompt, setImageStylePrompt] = useState(draft.imageStylePrompt);
  const [audioMode, setAudioMode] = useState<'tts' | 'import'>(draft.audioMode || 'tts');
  const [importedAudio, setImportedAudio] = useState<{ file: string; duration: number; name: string } | null>(draft.importedAudio || null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioBoundaries, setAudioBoundaries] = useState(draft.audioBoundaries || '');
  const importRequest = useRef(0);
  const audioFileInput = useRef<HTMLInputElement>(null);
  const handleImportAudio = async (file?: File) => {
    if (!file) return;
    const request = ++importRequest.current;
    setImportedAudio(null);
    setAudioBoundaries('');
    setErrorMessage(null);
    if (file.size > 100 * 1024 * 1024) { setErrorMessage('Tệp audio phải nhỏ hơn 100 MB.'); return; }
    setAudioUploading(true);
    try {
      const response = await fetch('/api/audio/import', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không nhập được audio.');
      if (request === importRequest.current) setImportedAudio({ ...data, name: file.name });
    } catch (error: any) {
      if (request === importRequest.current) setErrorMessage(error.message);
    } finally { if (request === importRequest.current) setAudioUploading(false); }
  };
  const [draftSaved, setDraftSaved] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isVoiceSectionOpen, setIsVoiceSectionOpen] = useState<boolean>(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const dialogRef = useDialog(onCancel, !isCreating && !audioUploading);
  useEffect(() => {
    setDraftSaved(saveCreatorDraft({ voice: selectedVoice, speed, text: textContent, title: scriptTitle, subtitle: scriptSubtitle, imageStylePrompt, imageDensity, audioMode, importedAudio, audioBoundaries }));
  }, [selectedVoice, speed, textContent, scriptTitle, scriptSubtitle, imageStylePrompt, imageDensity, audioMode, importedAudio, audioBoundaries]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepKey, setCurrentStepKey] = useState<string>('storyboard');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [progressDetails, setProgressDetails] = useState<Record<string, any>>({});
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [creationSuccess, setCreationSuccess] = useState<boolean>(false);
  const [showTerminalLogs, setShowTerminalLogs] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(() => {
    return localStorage.getItem('openai_api_key') || '';
  });
  const [selectedImageProvider, setSelectedImageProvider] = useState<'google_ai_studio' | 'flux_local'>(() => {
    return (localStorage.getItem('preferred_image_provider') as any) || 'google_ai_studio';
  });
  const [aiStudioConnected, setAiStudioConnected] = useState<boolean>(false);
  const [fluxAvailable, setFluxAvailable] = useState<boolean>(true);
  const [isTestingProvider, setIsTestingProvider] = useState<boolean>(false);
  const [providerTestMessage, setProviderTestMessage] = useState<string>('');

  const checkImageProviderStatus = async () => {
    try {
      const res = await fetch('/api/image-provider/status');
      if (res.ok) {
        const data = await res.json();
        setAiStudioConnected(data.aiStudioSession?.sessionValid ?? false);
        setFluxAvailable(data.fluxAvailable ?? true);
        if (data.preferredProvider) {
          setSelectedImageProvider(data.preferredProvider);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    checkImageProviderStatus();
  }, []);

  const handleSelectProvider = async (provider: 'google_ai_studio' | 'flux_local') => {
    setSelectedImageProvider(provider);
    localStorage.setItem('preferred_image_provider', provider);
    try {
      await fetch('/api/image-provider/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredProvider: provider }),
      });
    } catch (_) {}
  };

  const handleTestAIStudio = async () => {
    setIsTestingProvider(true);
    setProviderTestMessage('Đang mở Chrome profile & kiểm tra kết nối Google AI Studio...');
    try {
      const res = await fetch('/api/image-provider/test-connection', { method: 'POST' });
      const data = await res.json();
      if (data.session?.sessionValid) {
        setAiStudioConnected(true);
        setProviderTestMessage('✓ Đã kết nối Google AI Studio thành công! Trình duyệt đã sẵn sàng.');
      } else {
        setAiStudioConnected(false);
        setProviderTestMessage('Vui lòng đăng nhập tài khoản Google trên cửa sổ Chrome vừa mở, sau đó bấm Test lại.');
      }
    } catch (err: any) {
      setProviderTestMessage(`Lỗi: ${err.message}`);
    } finally {
      setIsTestingProvider(false);
      checkImageProviderStatus();
    }
  };

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
    setSelectedPresetId(preset.id);
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

    if (audioMode === 'import' && !/^(CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]/im.test(trimmed)) {
      return trimmed.split(/\n\s*\n/).map((text, index) => ({ title: `Cảnh ${index + 1}`, text: text.trim() })).filter(scene => scene.text);
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
    if (audioMode === 'tts' && !textContent.trim()) {
      setErrorMessage('Vui lòng nhập nội dung kịch bản trước khi bấm Tạo Video');
      return;
    }
    if (!imageStylePrompt.trim()) { setErrorMessage('Hãy nhập phong cách hình ảnh hoặc khôi phục mặc định.'); return; }
    if (audioMode === 'import' && !importedAudio) { setErrorMessage('Hãy nhập tệp audio trước khi tạo video.'); return; }
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
    if (audioMode === 'tts' && rawParsedScenes.length === 0) {
      setErrorMessage('Không nhận diện được phân cảnh nào từ kịch bản.');
      setIsCreating(false);
      return;
    }

    try {
      let effectiveTitle = (scriptTitle || '').trim();
      if (!effectiveTitle) {
        const firstScene = rawParsedScenes[0];
        effectiveTitle = firstScene?.title ? firstScene.title : 'Video mới';
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          subtitle: scriptSubtitle || (audioMode === 'import' ? 'Audio đã nhập' : `Giọng đọc ${speed}×`),
          voice: selectedVoice,
          speed,
          content: textContent,
          scenes: rawParsedScenes,
          geminiApiKey: geminiApiKey.trim() || undefined,
          openaiApiKey: openaiApiKey.trim() || undefined,
          preferredImageProvider: selectedImageProvider,
          imageStylePrompt,
          imageDensity,
          importedAudio: audioMode === 'import' ? importedAudio?.file : undefined,
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
              setCurrentMessage('Đã tạo xong. Đang mở video để xem trước…');
              setCreationLogs((prev) => [
                ...prev,
                `[${new Date().toLocaleTimeString()}] Video đã sẵn sàng phát.`,
              ]);
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Lỗi trong quá trình tạo video');
            }
          } catch (lineErr: any) {
            if (!(lineErr instanceof SyntaxError)) {
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
  const estimatedSeconds = audioMode === 'import' ? (importedAudio?.duration || 0) : ((wordCount / 3.2) / speed);
  const selectedVoiceObj = VOICE_OPTIONS.find((v) => v.id === selectedVoice) || { ...VOICE_OPTIONS[0], id: selectedVoice, name: selectedVoice };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="creator-title" tabIndex={-1} className="creator-panel" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <div className="creator-header" inert={isCreating}
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src="/favicon.svg" alt="" width={36} height={36} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 id="creator-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Tạo video mới
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Wevic Video Studio
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconButton label="Đóng trình tạo video" onClick={onCancel} disabled={isCreating || audioUploading}><X size={18} /></IconButton>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div role="alert"
          style={{
            maxWidth: 1040,
            margin: '12px auto 0',
            width: 'calc(100% - 40px)',
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

      {/* Main Scrollable Content */}
      <div className="creator-scroll" inert={isCreating}>
        <div className="creator-intro"><h1>Bắt đầu một video mới</h1><p>Chuẩn bị nội dung, chọn âm thanh và định hình phong cách.</p></div>
        <div className="creator-workspace">

          {/* Section 2: Script Content (Hero section - Only 1 Textarea) */}
          <div
            className="card script-card"
          >
            {/* Header with Presets & Upload */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <span className="creator-section-title" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Kịch bản
                </span>

              </div>

              {/* Action tools: File Upload & Clear */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary creator-file-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Nhập tệp kịch bản</button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.srt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {textContent && (
                  <IconButton label="Xóa kịch bản" onClick={() => { setTextContent(''); setSelectedPresetId(null); setUploadedFileName(null); }}><Trash2 size={17} /></IconButton>
                )}
              </div>
            </div>

            {/* ONLY ONE CLEAN TEXTAREA - NO PRESETS */}
            <label className="label" htmlFor="script-title">Tên video</label>
            <input id="script-title" className="input" value={scriptTitle} onChange={event => setScriptTitle(event.target.value)} placeholder="Đặt tên cho video" />
            <label className="label" htmlFor="script-content">{audioMode === 'import' ? 'Kịch bản tham khảo (không bắt buộc)' : 'Nội dung lời thoại'}</label>
            <p id="script-help" className="editor-help creator-script-help">{audioMode === 'import' ? 'Audio quyết định lời thoại, cảnh và nhịp ảnh. Kịch bản ở đây chỉ giúp AI hiểu chủ đề; không cần khớp từng câu với bản thu.' : 'Nhập toàn bộ lời thoại. AI sẽ chia cảnh, chia nhịp ảnh và viết prompt theo phong cách bạn chọn.'}</p>
            <textarea id="script-content" aria-describedby="script-help"
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                setSelectedPresetId(null);
                setErrorMessage(null);
              }}
              rows={17}
              className="input"
              style={{
                width: '100%',
                resize: 'vertical',
                lineHeight: 1.65,
                fontSize: 14,
                fontFamily: 'inherit',
                minHeight: 320,
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
              }}
              placeholder="Nhập toàn bộ kịch bản phân cảnh tại đây "
            />

            {/* Textarea Footer Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{wordCount}</strong> từ
                </span>
                <span>•</span>
                <span>
                  {audioMode === 'import' ? 'Thời lượng audio: ' : 'Thời lượng dự kiến: '}<strong style={{ color: 'var(--accent)' }}>{estimatedSeconds > 0 ? `${audioMode === 'tts' ? '≈' : ''}${Math.floor(Math.round(estimatedSeconds) / 60)}:${String(Math.round(estimatedSeconds) % 60).padStart(2, '0')}` : '—'}</strong>
                </span>
                <span>•</span>
                <span>
                  {audioMode === 'import' && audioBoundaries.trim() ? `${parseContentToScenes(textContent).length} cảnh theo mốc thủ công` : 'Số cảnh do AI quyết định'}
                </span>
              </div>

            </div>
          </div>

          <aside className="creator-options">
          <section className="card editor-settings">
            <h3>Âm thanh</h3>
            <div className="audio-source-options" role="group" aria-label="Nguồn âm thanh">
              <label><input type="radio" name="audio-source" checked={audioMode === 'tts'} onChange={() => setAudioMode('tts')} aria-label="Tạo giọng đọc" aria-describedby="tts-source-help" /> <span>Tạo giọng đọc<small id="tts-source-help">Chọn giọng và tốc độ từ lời thoại của bạn.</small></span></label>
              <label><input type="radio" name="audio-source" checked={audioMode === 'import'} onChange={() => { audioPreviewManager.stop(); setPlayingVoiceId(null); setAudioMode('import'); }} aria-label="Nhập audio có sẵn" aria-describedby="import-source-help" /> <span>Nhập audio có sẵn<small id="import-source-help">Dùng bản thu của bạn, giữ nguyên giọng và tốc độ.</small></span></label>
            </div>
            {audioMode === 'import' && <>
              <div className="editor-actions"><button type="button" className="btn btn-secondary creator-file-button" disabled={audioUploading} onClick={() => audioFileInput.current?.click()}>{audioUploading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}{audioUploading ? 'Đang nhập audio…' : importedAudio ? 'Đổi tệp audio' : 'Chọn tệp audio'}</button></div>
              <input ref={audioFileInput} id="audio-upload" aria-label="Tệp audio" type="file" accept="audio/*,.m4a,.flac" hidden disabled={audioUploading} onChange={event => void handleImportAudio(event.target.files?.[0])} />
              <p className="editor-help">MP3, WAV, M4A, OGG, FLAC · Tối đa 100 MB</p>
              {audioUploading && <p role="status">Đang nhập và kiểm tra audio…</p>}
              {importedAudio && <AudioTimingEditor audio={importedAudio} scenes={[]} boundaries={audioBoundaries} onChange={value => { setAudioBoundaries(value); setErrorMessage(null); }} />}
              <p className="editor-help">AI lấy lời thoại từ audio để chia cảnh và lên ý tưởng ảnh. Bản thu giữ nguyên giọng và tốc độ.</p>
            </>}
          </section>
          {audioMode === 'tts' && <>
          {/* Section 1: Voice & Speed (Collapsible) */}
          <div
            className="card"
            style={{
              padding: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {/* Collapsible Header */}
            <button type="button" aria-expanded={isVoiceSectionOpen} className="voice-toggle"
              onClick={() => setIsVoiceSectionOpen(!isVoiceSectionOpen)}
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: isVoiceSectionOpen ? 'var(--bg-elevated)' : 'transparent',
                transition: 'background 0.15s ease',
                width: '100%',
                textAlign: 'left',
                border: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Mic style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Giọng đọc và tốc độ
                </span>
                <span className="badge badge-accent" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {selectedVoiceObj.name} ({selectedVoiceObj.gender === 'female' ? 'Nữ' : 'Nam'} · {selectedVoiceObj.tag})
                </span>
                <span className="badge badge-secondary" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {speed}×
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
                <span>{isVoiceSectionOpen ? 'Thu gọn' : 'Tùy chỉnh'}</span>
                {isVoiceSectionOpen ? (
                  <ChevronUp style={{ width: 16, height: 16 }} />
                ) : (
                  <ChevronDown style={{ width: 16, height: 16 }} />
                )}
              </div>
            </button>

            {/* Collapsible Body */}
            {isVoiceSectionOpen && (
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Chọn giọng đọc AI:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                    {VOICE_OPTIONS.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPlayingThis = playingVoiceId === voice.id;
                      return (
                        <div
                          key={voice.id}
                          onClick={() => setSelectedVoice(voice.id)}
                          className={`card ${isSelected ? 'card-active' : ''}`}
                          style={{
                            padding: '12px 14px',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="radio" name="voice" aria-label={voice.name} checked={isSelected} onChange={() => setSelectedVoice(voice.id)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-sm)',
                                background: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                                color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {voice.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {voice.tag} · {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                              </div>
                            </div>
                          </div>

                          <IconButton
                            onClick={(e) => handleTogglePlayVoice(voice, e)}
                            className={`btn ${isPlayingThis ? 'btn-primary' : 'btn-secondary'}`}
                            label={`${isPlayingThis ? 'Dừng' : 'Nghe thử'} giọng ${voice.name}`}
                          >
                            {isPlayingThis ? <VolumeX style={{ width: 13, height: 13 }} /> : <Volume2 style={{ width: 13, height: 13 }} />}
                          </IconButton>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Tốc độ phát âm:
                    </span>
                    <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                      {speed}×
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(64px, 1fr))', gap: 6 }}>
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
                            padding: '8px 4px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`,
                            background: isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s',
                            fontSize: 11,
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          <div>{preset.label}</div>
                          <div style={{ fontSize: 11, marginTop: 2 }}>{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          </>}
          <section className="card editor-settings">
            <h3>Mật độ hình ảnh</h3>
            <fieldset className="density-options" aria-describedby="density-help">
              <legend>Nhịp đổi ảnh</legend>
              {([
                { value: 'sparse', label: 'Thưa', seconds: '≈6 giây/ảnh' },
                { value: 'balanced', label: 'Vừa', seconds: '≈4 giây/ảnh' },
                { value: 'dense', label: 'Dày', seconds: '≈2,5 giây/ảnh' },
              ] as const).map(option => <label key={option.value}>
                <input type="radio" name="image-density" value={option.value} checked={imageDensity === option.value} onChange={() => setImageDensity(option.value)} />
                <strong>{option.label}</strong><span>{option.seconds}</span>
              </label>)}
            </fieldset>
            <p id="density-help" className="editor-help">{imageDensity === 'sparse' ? 'Ít ảnh, có thêm thời gian xem chi tiết.' : imageDensity === 'dense' ? 'Nhiều ảnh trong mỗi cảnh, nhịp nhanh hơn. Tốn thêm thời gian tạo ảnh.' : 'Cân bằng số ảnh và thời gian xem.'} Mốc đổi ảnh được căn theo lời đọc.</p>
          </section>
          <details className="card style-settings">
            <summary><span>Phong cách hình ảnh</span><span className="editor-help">{imageStylePrompt === defaultPrompt ? 'Minh họa nét vẽ đơn giản · Mặc định' : imageStylePrompt.trim() ? 'Đang dùng phong cách tùy chỉnh' : 'Chưa có mô tả phong cách'}</span></summary>
            <div className="editor-settings">
              <label htmlFor="image-style">Prompt phong cách</label>
              <textarea id="image-style" className="input" rows={10} maxLength={10000} value={imageStylePrompt} onChange={event => setImageStylePrompt(event.target.value)} />
              <p className="editor-help">Lưu cho video mới và áp dụng chung cho mọi ảnh. Bạn có thể viết bằng tiếng Việt hoặc tiếng Anh.</p>
              <button type="button" className="btn btn-secondary creator-file-button" onClick={() => setImageStylePrompt(defaultPrompt)}><RotateCcw size={16} /> Khôi phục phong cách mặc định</button>
            </div>
          </details>


          </aside>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="creator-actions" inert={isCreating}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 40,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span role="status">{audioMode === 'tts' && !textContent.trim() ? 'Nhập lời thoại để tạo video.' : audioUploading ? 'Đang nhập audio…' : audioMode === 'import' && !importedAudio ? 'Chọn tệp audio để tiếp tục.' : !imageStylePrompt.trim() ? 'Mở Phong cách hình ảnh để nhập prompt.' : draftSaved ? 'Đã lưu bản nháp' : 'Không thể lưu bản nháp'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleCreateVideo}
            disabled={isCreating || audioUploading || (audioMode === 'tts' && !textContent.trim()) || !imageStylePrompt.trim() || (audioMode === 'import' && !importedAudio)}
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
                <Film style={{ width: 16, height: 16 }} />
                <span>Tạo video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Creation Progress Modal & Real-Time Pipeline Checklist */}
      {isCreating && (
        <div className="generation-overlay">
          <section className="creation-progress" aria-labelledby="generation-heading" aria-busy={!creationSuccess}>
            <div className="generation-heading"><div className="generation-symbol">{creationSuccess ? <CheckCircle2 size={26} /> : <Film size={26} />}</div><div><h2 id="generation-heading">{creationSuccess ? 'Video đã sẵn sàng' : 'Đang tạo video của bạn'}</h2><p>{scriptTitle || 'Video mới'}</p></div><strong>{progressPercent}%</strong></div>
            <progress className="generation-meter" max={100} value={progressPercent} aria-label="Tiến độ tạo video" />
            <p className="generation-message" role="status">{creationSuccess ? 'Hoàn tất. Đang mở trình chỉnh sửa…' : currentMessage || 'Đang chuẩn bị nội dung…'}</p>
            <ol className="generation-steps">{PIPELINE_STEPS.map((step, index) => {
              const status = getStepStatus(step.key, index);
              return <li key={step.key} className={`generation-step ${status}`} aria-current={status === 'active' ? 'step' : undefined}>
                <span className="generation-step-number">{status === 'completed' ? <Check size={16} /> : status === 'active' ? <Loader2 size={16} className="animate-spin" /> : step.number}</span>
                <div><h3>{step.key === 'tts' && audioMode === 'import' ? 'Chuẩn bị audio đã nhập' : step.title}</h3><p>{step.key === 'tts' && audioMode === 'import' ? 'Giữ nguyên giọng đọc và căn thời gian cho từng cảnh.' : step.desc}</p></div>
                <span className="generation-step-state">{status === 'completed' ? 'Xong' : status === 'active' ? 'Đang chạy' : 'Chờ'}</span>
              </li>;
            })}</ol>
            <details className="generation-logs" open={showTerminalLogs} onToggle={event => setShowTerminalLogs(event.currentTarget.open)}><summary>Chi tiết xử lý</summary><div>{creationLogs.map((log, index) => <p key={index}>{log}</p>)}<div ref={logsEndRef} /></div></details>
            <p className="generation-footnote">Giữ trang này mở trong khi video đang được tạo.</p>
          </section>
        </div>
      )}
    </div>
  );
};
