import { StoryboardReview, StoryboardDraft } from './StoryboardReview';
import { StudioBrand } from './StudioBrand';
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
  ArrowLeft,
  Sparkles,
  Sliders,
  Palette,
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
  { value: 0.75, label: '0.75×' },
  { value: 0.9, label: '0.9×' },
  { value: 1.0, label: '1.0×' },
  { value: 1.15, label: '1.15×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
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
  const [videoMode, setVideoMode] = useState<'images' | 'remotion'>(draft.videoMode || 'images');
  const [chatgptStatus, setChatgptStatus] = useState('Mở ChatGPT để đăng nhập trước khi tạo hoạt hình.');
  const [chatgptBusy, setChatgptBusy] = useState(false);
  const connectChatGPT = async (open = false) => {
    setChatgptBusy(true);
    try {
      const response = await fetch(`/api/chatgpt/${open ? 'connect' : 'status'}`, { method: open ? 'POST' : 'GET' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setChatgptStatus(result.message);
    } catch (error: any) { setChatgptStatus(error.message); }
    finally { setChatgptBusy(false); }
  };
  const [speed, setSpeed] = useState<number>(draft.speed);
  const [contentMode, setContentMode] = useState<'text' | 'file'>('text');
  const [directorInputKind,setDirectorInputKind]=useState<'script'|'idea'>(draft.directorInputKind||'script');
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
  const [storyboardDraft, setStoryboardDraft] = useState<StoryboardDraft | null>(null);
  const [editingApprovedBoard, setEditingApprovedBoard] = useState(false);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('storyboard') || localStorage.getItem('pending_storyboard_id');
    if (id) fetch(`/api/storyboard/${id}`).then(r => r.ok ? r.json() : null).then(d => {if(d && ['draft','failed','building','complete'].includes(d.status)) {setStoryboardDraft(d);localStorage.setItem('pending_storyboard_id',d.id);}}).catch(() => {});
  }, []);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  useEffect(() => {
    if (isCreating || !storyboardDraft || !['building','failed'].includes(storyboardDraft.status)) return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      const latest = await fetch(`/api/storyboard/${storyboardDraft.id}`).then(r => r.ok ? r.json() : null).catch(() => null);
      if (!cancelled && latest) {
        setStoryboardDraft(latest);
        if (latest.status === 'building' && storyboardDraft.status !== 'building') setErrorMessage(null);
      }
    }, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [isCreating, storyboardDraft?.id, storyboardDraft?.status]);
  const dialogRef = useDialog(onCancel, !isCreating && !audioUploading && !storyboardDraft);
  useEffect(() => {
    setDraftSaved(saveCreatorDraft({ directorInputKind, videoMode, voice: selectedVoice, speed, text: textContent, title: scriptTitle, subtitle: scriptSubtitle, imageStylePrompt, imageDensity, audioMode, importedAudio, audioBoundaries }));
  }, [directorInputKind, videoMode, selectedVoice, speed, textContent, scriptTitle, scriptSubtitle, imageStylePrompt, imageDensity, audioMode, importedAudio, audioBoundaries]);
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
    if (videoMode === 'images') void checkImageProviderStatus();
    else void connectChatGPT();
  }, [videoMode]);

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

  const handleCreateVideo = async (approved?: StoryboardDraft) => {
    setErrorMessage(null);
    if (approved) {
      const latest = await fetch(`/api/storyboard/${approved.id}`).then(r => r.ok ? r.json() : null).catch(() => null);
      if (latest && ['building','complete'].includes(latest.status)) {
        setStoryboardDraft(latest);
        setEditingApprovedBoard(false);
        return;
      }
    }
    if (!approved && audioMode === 'tts' && !textContent.trim()) {
      setErrorMessage('Vui lòng nhập nội dung kịch bản trước khi bấm Tạo Video');
      return;
    }
    if (!approved && videoMode === 'images' && !imageStylePrompt.trim()) { setErrorMessage('Hãy nhập phong cách hình ảnh hoặc khôi phục mặc định.'); return; }
    if (!approved && audioMode === 'import' && !importedAudio) { setErrorMessage('Hãy nhập tệp audio trước khi tạo video.'); return; }
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
    if (!approved && audioMode === 'tts' && rawParsedScenes.length === 0) {
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
        body: JSON.stringify(approved ? {videoMode:'remotion',storyboardId:approved.id,revision:approved.revision} : {
          videoMode,
          inputKind:videoMode==='remotion'&&audioMode==='tts'?directorInputKind:'script',
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
          audioBoundaries: audioMode === 'import' && audioBoundaries.trim() ? audioBoundaries.split(/[,;\s]+/).filter(Boolean).map(Number) : undefined,
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
            } else if (event.type === 'storyboard') {
              setStoryboardDraft(event.result.draft);
              localStorage.setItem('pending_storyboard_id', event.result.draft.id);
              setIsCreating(false);
              return;
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

      setStoryboardDraft(null);
      localStorage.removeItem('pending_storyboard_id');
      const multiBeatScenes = buildMultiBeatScenes(finalResultData.scenes);
      await new Promise((r) => setTimeout(r, 700));
      onGenerateNewVideo(multiBeatScenes, finalResultData.metadata);
      setIsCreating(false);
    } catch (err: any) {
      console.error('Error generating video:', err);
      if (approved) {
        const latest = await fetch(`/api/storyboard/${approved.id}`).then(r => r.ok ? r.json() : null).catch(() => null);
        if (latest) setStoryboardDraft(latest);
        setEditingApprovedBoard(false);
      }
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

  if (storyboardDraft && !isCreating && !editingApprovedBoard && (storyboardDraft.approvedRevision === storyboardDraft.revision || ['building','complete'].includes(storyboardDraft.status))) return <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Tiếp tục dựng video" tabIndex={-1} className="creator-panel"><section className="board-review">
    <header className="board-header"><div><h1>{storyboardDraft.title}</h1><p>Storyboard đã duyệt · Bản {storyboardDraft.revision}</p></div><button className="btn btn-secondary" onClick={onCancel}>Đóng</button></header>
    <main className="board-detail"><h2>{storyboardDraft.status === 'complete' ? 'Video đã dựng xong' : storyboardDraft.status === 'building' ? (storyboardDraft.stopRequested ? 'Đang dừng tác vụ' : 'Tác vụ chưa hoàn tất') : 'Quá trình dựng bị gián đoạn'}</h2><p role="status">{storyboardDraft.status === 'building' ? (errorMessage || storyboardDraft.progress?.message || 'Chưa có thông tin tiến trình. Trạng thái này không xác nhận video đang được render.') : errorMessage || storyboardDraft.lastError || 'Storyboard đã được duyệt. Các cảnh đã dựng đạt yêu cầu vẫn được giữ lại.'}</p>{storyboardDraft.status === 'building' && <><p>{storyboardDraft.progress?.updatedAt ? `Cập nhật cuối: ${new Date(storyboardDraft.progress.updatedAt).toLocaleTimeString()}.` : 'Chưa ghi nhận cập nhật tiến trình.'} Nếu không có tiến triển, bạn có thể dừng tác vụ rồi tiếp tục.</p><button className="btn btn-secondary" disabled={storyboardDraft.stopRequested} onClick={async()=>{
      try {
        const response = await fetch(`/api/storyboard/${storyboardDraft.id}/stop`,{method:'POST'});
        const result = await response.json();
        if(!response.ok)throw new Error(result.error || 'Không dừng được tác vụ.');
        setStoryboardDraft(result);
      } catch(error:any) {setErrorMessage(error.message);}
    }}>{storyboardDraft.stopRequested ? 'Đang dừng…' : 'Dừng tác vụ bị treo'}</button></>}<p>Tiếp tục dựng sẽ dùng bản đã duyệt và thực hiện phần còn thiếu.</p></main>
    <footer className="board-footer"><button className="btn btn-secondary" disabled={['building','complete'].includes(storyboardDraft.status)} onClick={()=>setEditingApprovedBoard(true)}>Xem hoặc sửa storyboard</button>{storyboardDraft.status === 'complete' && storyboardDraft.projectId ? <a className="btn btn-primary" href={`/project/${storyboardDraft.projectId}`}>Mở video</a> : <button className="btn btn-primary" disabled={storyboardDraft.status === 'building'} onClick={()=>handleCreateVideo(storyboardDraft)}>{storyboardDraft.status === 'building' ? 'Chờ tác vụ kết thúc' : 'Tiếp tục dựng'}</button>}</footer>
  </section></div>;

  if (storyboardDraft && !isCreating) return <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Duyệt storyboard" tabIndex={-1} className="creator-panel"><StoryboardReview draft={storyboardDraft} error={errorMessage} onChange={setStoryboardDraft} onApprove={handleCreateVideo} onClose={onCancel} onBack={()=>{setStoryboardDraft(null);localStorage.removeItem('pending_storyboard_id');}} /></div>;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-title"
      tabIndex={-1}
      className="creator-panel"
    >
      {/* Studio Top Navigation Bar */}
      <header className="creator-header" inert={isCreating}>
        <div className="creator-header-left">
          <StudioBrand />
          <div className="creator-header-titles">
            <h1 id="creator-title" className="creator-title">
              Tạo video mới
            </h1>

          </div>
        </div>

        <div className="creator-header-right">
          <div className="creator-save-pill" title="Trạng thái bản nháp">
            <span className={`save-dot ${draftSaved ? 'saved' : ''}`} aria-hidden="true" />
            <span>{draftSaved ? 'Đã lưu nháp' : 'Chưa lưu nháp'}</span>
          </div>
          <IconButton
            label="Đóng trình tạo video"
            onClick={onCancel}
            disabled={isCreating || audioUploading}
          >
            <X size={18} />
          </IconButton>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="creator-alert-banner" role="alert">
          <AlertCircle size={16} className="alert-icon" aria-hidden="true" />
          <span>{errorMessage}</span>
          <button
            type="button"
            className="alert-dismiss"
            onClick={() => setErrorMessage(null)}
            aria-label="Đóng thông báo lỗi"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Studio Scroll Canvas */}
      <div className="creator-scroll" inert={isCreating}>
        <div className="creator-intro">
          <h2>Thiết lập kịch bản và phong cách video</h2>
        </div>

        <div className="creator-workspace">
          {/* Left Column: Script Canvas */}
          <div className="script-studio-card">
            {/* Header row with Tools */}
            <div className="studio-card-header">
              <div className="card-badge-title">
                <FileText size={16} className="title-icon" aria-hidden="true" />
                <span>Kịch bản video</span>
              </div>

              <div className="script-tools">
                <button
                  type="button"
                  className="btn btn-secondary tool-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Nhập tệp .txt, .md hoặc .srt"
                >
                  <Upload size={14} aria-hidden="true" />
                  <span>Nhập tệp</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.json,.srt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {textContent && (
                  <button
                    type="button"
                    className="btn btn-ghost tool-btn text-danger"
                    onClick={() => {
                      setTextContent('');
                      setSelectedPresetId(null);
                      setUploadedFileName(null);
                    }}
                    title="Xóa toàn bộ nội dung kịch bản"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Inspiration Templates */}
            <div className="preset-chips-bar" aria-label="Kịch bản mẫu">
              <span className="preset-label">Mẫu gợi ý:</span>
              <div className="preset-chips-scroll">
                {SAMPLE_SCRIPTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-chip ${selectedPresetId === preset.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setScriptTitle(preset.title);
                      setTextContent(preset.content);
                      setErrorMessage(null);
                    }}
                  >
                    <Sparkles size={12} aria-hidden="true" />
                    <span>{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="form-group">
              <label htmlFor="script-title" className="field-label">
                Tiêu đề video
              </label>
              <input
                id="script-title"
                className="input script-title-input"
                value={scriptTitle}
                onChange={(event) => setScriptTitle(event.target.value)}
                placeholder="Đặt tên cho video của bạn (ví dụ: Kinh Tế Học Phòng Gym)…"
              />
            </div>

            {/* Script Textarea */}
            <div className="form-group script-body-group">
              <div className="field-label-row">
                <label htmlFor="script-content" className="field-label">
                  {audioMode === 'import' ? 'Kịch bản tham khảo (tùy chọn)' : 'Nội dung lời thoại phân cảnh'}
                </label>
                {audioMode === 'import' && <span className="field-hint">Audio sẽ quyết định thời lượng và cảnh.</span>}
              </div>
              <textarea
                id="script-content"
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  setSelectedPresetId(null);
                  setErrorMessage(null);
                }}
                rows={16}
                className="input script-editor-textarea"
                placeholder="Nhập toàn bộ kịch bản phân cảnh tại đây… CẢNH 1: Tiêu đề cảnh, Lời thoại…"
              />
            </div>

            {/* Textarea Footer Stats */}
            <div className="script-stats-bar">
              <div className="stat-item">
                <span className="stat-label">Từ:</span>
                <strong className="stat-value">{wordCount}</strong>
              </div>
              <div className="stat-separator">•</div>
              <div className="stat-item">
                <span className="stat-label">Thời lượng dự kiến:</span>
                <strong className="stat-value stat-accent">
                  {estimatedSeconds > 0
                    ? `${audioMode === 'tts' ? '≈ ' : ''}${Math.floor(Math.round(estimatedSeconds) / 60)}:${String(Math.round(estimatedSeconds) % 60).padStart(2, '0')}`
                    : '0:00'}
                </strong>
              </div>

            </div>
          </div>

          {/* Right Column: Studio Inspector */}
          <aside className="creator-inspector">
            <section className="inspector-card video-mode-card" aria-labelledby="video-mode-label">
              <h2 id="video-mode-label">Kiểu video</h2>
              <div className="video-mode-options">
                <label className={videoMode === 'images' ? 'selected' : ''}>
                  <input type="radio" name="video-mode" value="images" checked={videoMode === 'images'} onChange={() => setVideoMode('images')} />
                  <span><strong>Ảnh minh họa</strong><small>Tạo ảnh theo lời đọc, ghép thành video.</small></span>
                </label>
                <label className={videoMode === 'remotion' ? 'selected' : ''}>
                  <input type="radio" name="video-mode" value="remotion" checked={videoMode === 'remotion'} onChange={() => setVideoMode('remotion')} />
                  <span><strong>Hoạt hình người que · Remotion</strong><small>Đạo diễn hoạt hình 2D: hành động thị giác, cảnh 2–6 giây, duyệt storyboard trước khi dựng.</small></span>
                </label>
              </div>
              {videoMode === 'remotion' && <div className="director-input-settings">
                {audioMode==='tts'&&<label>Đầu vào cho đạo diễn<select value={directorInputKind} onChange={e=>setDirectorInputKind(e.target.value as 'script'|'idea')}><option value="script">Kịch bản — giữ lời đọc</option><option value="idea">Ý tưởng — phát triển thành câu chuyện</option></select></label>}
                <p>Hệ thống tự chọn số cảnh theo nội dung và thời lượng lời đọc, mỗi cảnh 2–6 giây. Bạn duyệt và chỉnh storyboard trước khi dựng.</p>
              </div>}
              {videoMode === 'remotion' && <div className="chatgpt-connection">
                <p>ChatGPT lên ý tưởng và thiết kế chuyển động theo phong cách người que của bạn. Lời thoại và hướng dẫn phong cách sẽ được gửi vào ChatGPT.</p>
                <div className="toolbar-actions">
                  <button type="button" className="btn btn-secondary" disabled={chatgptBusy} onClick={() => void connectChatGPT(true)}>Mở ChatGPT đăng nhập</button>
                  <button type="button" className="btn btn-ghost" disabled={chatgptBusy} onClick={() => void connectChatGPT()}>Kiểm tra kết nối</button>
                </div>
                <p role="status">{chatgptBusy ? 'Đang kết nối…' : chatgptStatus}</p>
              </div>}
            </section>
            {/* Section 1: Audio Configuration */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <div className="card-badge-title">
                  <Mic size={16} className="title-icon" aria-hidden="true" />
                  <span>Nguồn âm thanh</span>
                </div>
              </div>

              {/* Segmented Switch */}
              <div className="segmented-tab-group" role="tablist" aria-label="Chọn nguồn âm thanh">
                <button
                  type="button"
                  role="tab"
                  aria-selected={audioMode === 'tts'}
                  className={`segmented-tab ${audioMode === 'tts' ? 'active' : ''}`}
                  onClick={() => setAudioMode('tts')}
                >
                  <Mic size={14} aria-hidden="true" />
                  <span>Giọng đọc AI</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={audioMode === 'import'}
                  className={`segmented-tab ${audioMode === 'import' ? 'active' : ''}`}
                  onClick={() => {
                    audioPreviewManager.stop();
                    setPlayingVoiceId(null);
                    setAudioMode('import');
                  }}
                >
                  <Upload size={14} aria-hidden="true" />
                  <span>Nhập file audio</span>
                </button>
              </div>

              {/* TTS Voice Selector */}
              {audioMode === 'tts' && (
                <div className="tts-controls">
                  <div className="sub-label">Chọn giọng đọc:</div>
                  <div className="voice-grid">
                    {VOICE_OPTIONS.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPlayingThis = playingVoiceId === voice.id;
                      return (
                        <div
                          key={voice.id}
                          className={`voice-tile ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedVoice(voice.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedVoice(voice.id);
                            }
                          }}
                        >
                          <div className="voice-tile-left">
                            <span className={`voice-avatar-badge ${voice.gender}`}>
                              {voice.gender === 'female' ? 'Nữ' : 'Nam'}
                            </span>
                            <div className="voice-info">
                              <span className="voice-name">{voice.name}</span>
                              <span className="voice-tag">
                                {voice.tag} · {voice.region}
                              </span>
                            </div>
                          </div>

                          <IconButton
                            onClick={(e) => handleTogglePlayVoice(voice, e)}
                            className={`btn-preview ${isPlayingThis ? 'playing' : ''}`}
                            label={`${isPlayingThis ? 'Dừng' : 'Nghe thử'} giọng ${voice.name}`}
                          >
                            {isPlayingThis ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </IconButton>
                        </div>
                      );
                    })}
                  </div>

                  {/* Speed Controls */}
                  <div className="speed-section">
                    <div className="speed-header">
                      <span className="sub-label">Tốc độ đọc:</span>
                      <strong className="speed-value">{speed}×</strong>
                    </div>
                    <div className="speed-pills">
                      {SPEED_PRESETS.map((preset) => {
                        const isActive = speed === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            className={`speed-pill ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setSpeed(preset.value);
                              if (playingVoiceId) {
                                const v = VOICE_OPTIONS.find((vo) => vo.id === playingVoiceId);
                                if (v) {
                                  audioPreviewManager.playVoicePreview(
                                    v,
                                    preset.value,
                                    () => setPlayingVoiceId(null),
                                    () => setPlayingVoiceId(null)
                                  );
                                }
                              }
                            }}
                          >
                            <span className="preset-label">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Imported Audio Controls */}
              {audioMode === 'import' && (
                <div className="import-audio-controls">
                  <button
                    type="button"
                    className="btn btn-secondary upload-audio-btn"
                    disabled={audioUploading}
                    onClick={() => audioFileInput.current?.click()}
                  >
                    {audioUploading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>
                      {audioUploading
                        ? 'Đang nhập audio…'
                        : importedAudio
                        ? 'Đổi file audio khác'
                        : 'Chọn file audio từ máy'}
                    </span>
                  </button>
                  <input
                    ref={audioFileInput}
                    id="audio-upload"
                    type="file"
                    accept="audio/*,.m4a,.flac"
                    hidden
                    disabled={audioUploading}
                    onChange={(event) => void handleImportAudio(event.target.files?.[0])}
                  />
                  <p className="field-hint text-center">
                    Hỗ trợ MP3, WAV, M4A, OGG, FLAC · Tối đa 100 MB
                  </p>
                  {importedAudio && (
                    <div className="imported-timing-wrapper">
                      <AudioTimingEditor
                        audio={importedAudio}
                        scenes={[]}
                        boundaries={audioBoundaries}
                        onChange={(value) => {
                          setAudioBoundaries(value);
                          setErrorMessage(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Pacing & Density */}
            <div className="inspector-card">
              <div className="inspector-card-header">
                <div className="card-badge-title">
                  <Gauge size={16} className="title-icon" aria-hidden="true" />
                  <span>{videoMode === 'remotion' ? 'Nhịp phân cảnh' : 'Mật độ hình ảnh'}</span>
                </div>
              </div>

              <div className="density-selector" role="radiogroup" aria-label="Nhịp đổi ảnh">
                {[
                  { value: 'sparse', label: 'Thưa', seconds: '≈6 giây / ảnh' },
                  { value: 'balanced', label: 'Cân bằng', seconds: '≈4 giây / ảnh' },
                  { value: 'dense', label: 'Dày', seconds: '≈2,5 giây / ảnh' },
                ].map((option) => {
                  const isChecked = imageDensity === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      className={`density-pill ${isChecked ? 'active' : ''}`}
                      onClick={() => setImageDensity(option.value as any)}
                    >
                      <strong className="density-title">{option.label}</strong>
                      <span className="density-meta">{videoMode === 'remotion' ? option.seconds.replace('ảnh', 'cảnh') : option.seconds}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Visual Style Prompt */}
            {videoMode === 'images' && <details className="inspector-card style-details">
              <summary className="style-summary">
                <div className="summary-left">
                  <Palette size={16} className="title-icon" aria-hidden="true" />
                  <span>Phong cách hình ảnh</span>
                </div>
                <span className="summary-status">
                  {imageStylePrompt === defaultPrompt
                    ? 'Mặc định'
                    : 'Tùy chỉnh'}
                </span>
              </summary>
              <div className="style-body">
                <label htmlFor="image-style" className="field-label">
                  Prompt phong cách hình ảnh:
                </label>
                <textarea
                  id="image-style"
                  className="input style-prompt-textarea"
                  rows={6}
                  maxLength={10000}
                  value={imageStylePrompt}
                  onChange={(event) => setImageStylePrompt(event.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-reset-style"
                  onClick={() => setImageStylePrompt(defaultPrompt)}
                >
                  <RotateCcw size={14} />
                  <span>Khôi phục phong cách mặc định</span>
                </button>
              </div>
            </details>}
          </aside>
        </div>
      </div>

      {/* Sticky Bottom Studio Dock */}
      <footer className="creator-dock" inert={isCreating}>
        <div className="dock-container">
          <div className="dock-actions">
            <button
              type="button"
              className="btn btn-secondary btn-dock-cancel"
              onClick={onCancel}
              disabled={isCreating || audioUploading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary btn-dock-create"
              onClick={() => handleCreateVideo()}
              disabled={
                isCreating ||
                audioUploading ||
                (audioMode === 'tts' && !textContent.trim()) ||
                (videoMode === 'images' && !imageStylePrompt.trim()) ||
                (audioMode === 'import' && !importedAudio)
              }
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tạo video ({progressPercent}%)…</span>
                </>
              ) : (
                <>
                  <Film size={16} />
                  <span>{videoMode === 'remotion' ? 'Tạo storyboard để duyệt' : 'Tạo video ngay'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Generation Progress Modal */}
      {isCreating && (
        <div className="generation-overlay">
          <section
            className="creation-progress"
            aria-labelledby="generation-heading"
            aria-busy={!creationSuccess}
          >
            <div className="generation-heading">
              <div className="generation-symbol">
                {creationSuccess ? <CheckCircle2 size={26} /> : <Film size={26} />}
              </div>
              <div className="generation-title-wrap">
                <h2 id="generation-heading">
                  {creationSuccess ? 'Video đã sẵn sàng' : 'Đang khởi tạo video'}
                </h2>
                <p>{scriptTitle || 'Video mới'}</p>
              </div>
              <strong className="generation-percent">{progressPercent}%</strong>
            </div>

            <progress
              className="generation-meter"
              max={100}
              value={progressPercent}
              aria-label="Tiến độ tạo video"
            />

            <p className="generation-message" role="status">
              {creationSuccess
                ? 'Hoàn tất. Đang chuyển tới trình phát video…'
                : currentMessage || 'Đang khởi tạo tiến trình xử lý…'}
            </p>

            <ol className="generation-steps">
              {PIPELINE_STEPS.map((step, index) => {
                const status = getStepStatus(step.key, index);
                return (
                  <li
                    key={step.key}
                    className={`generation-step ${status}`}
                    aria-current={status === 'active' ? 'step' : undefined}
                  >
                    <span className="generation-step-number">
                      {status === 'completed' ? (
                        <Check size={14} />
                      ) : status === 'active' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        step.number
                      )}
                    </span>
                    <div className="step-info">
                      <h3>
                        {videoMode === 'remotion' && step.key === 'beat_plan' ? 'Thiết kế chuyển động với ChatGPT' : videoMode === 'remotion' && step.key === 'images' ? 'Dựng các lớp vector' : step.key === 'tts' && audioMode === 'import'
                          ? 'Chuẩn bị audio đã nhập'
                          : step.title}
                      </h3>
                      <p>
                        {videoMode === 'remotion' && step.key === 'beat_plan' ? 'Bố cục, hành động và nhịp chuyển động cho từng cảnh.' : videoMode === 'remotion' && step.key === 'images' ? 'Tái sử dụng nhân vật và phong cách người que.' : videoMode === 'remotion' && step.key === 'render' ? 'Remotion dựng từng frame và xuất MP4 với audio.' : step.key === 'tts' && audioMode === 'import'
                          ? 'Giữ nguyên giọng đọc và căn thời gian cho từng cảnh.'
                          : step.desc}
                      </p>
                    </div>
                    <span className="generation-step-state">
                      {status === 'completed' ? 'Xong' : status === 'active' ? 'Đang chạy' : 'Chờ'}
                    </span>
                  </li>
                );
              })}
            </ol>

            <details
              className="generation-logs"
              open={showTerminalLogs}
              onToggle={(event) => setShowTerminalLogs(event.currentTarget.open)}
            >
              <summary>Chi tiết xử lý và tiến trình</summary>
              <div>
                {creationLogs.map((log, index) => (
                  <p key={index}>{log}</p>
                ))}
                <div ref={logsEndRef} />
              </div>
            </details>

            <p className="generation-footnote">
              Vui lòng giữ trang này mở trong khi video đang được xử lý.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
