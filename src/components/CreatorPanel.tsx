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
} from 'lucide-react';
import { VoiceOption, SceneData, VideoMetadata } from '../types/scenes';
import { buildMultiBeatScenes } from '../utils/stickmanArtGenerator';
import { audioPreviewManager, SAMPLE_PHRASES } from '../utils/audioPreview';

export const VOICE_OPTIONS: VoiceOption[] = [
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
  const [creationStep, setCreationStep] = useState<number>(0);
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [creationSuccess, setCreationSuccess] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { audioPreviewManager.stop(); };
  }, []);

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
        setTextContent(text);
        setScriptTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const parseContentToScenes = (rawText: string): { title: string; text: string }[] => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: { title: string; text: string }[] = [];
    let currentTitle = '';
    let currentBody: string[] = [];
    for (const line of lines) {
      if (/^(CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]/i.test(line) || /^#+\s+/i.test(line)) {
        if (currentTitle && currentBody.length > 0) {
          parsed.push({ title: currentTitle, text: currentBody.join(' ') });
        }
        currentTitle = line.replace(/^(CẢNH|SCENE|PHẦN|ĐOẠN)\s*\d+[:.-]\s*/i, '').replace(/^#+\s*/, '').trim();
        currentBody = [];
      } else {
        if (!currentTitle) currentTitle = `Cảnh ${parsed.length + 1}`;
        currentBody.push(line);
      }
    }
    if (currentTitle && currentBody.length > 0) {
      parsed.push({ title: currentTitle, text: currentBody.join(' ') });
    }
    if (parsed.length === 0) {
      const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      paragraphs.forEach((p, idx) => {
        parsed.push({ title: `Cảnh ${idx + 1}`, text: p.trim() });
      });
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
    setCreationStep(1);
    setCreationLogs(['[1/4] Phân tích kịch bản & trích xuất phân cảnh...']);

    const rawParsedScenes = parseContentToScenes(textContent);
    if (rawParsedScenes.length === 0) {
      setErrorMessage('Không nhận diện được phân cảnh nào từ kịch bản.');
      setIsCreating(false);
      return;
    }

    setCreationLogs([
      `[1/3] Tạo Audio TTS: Phân tích ${rawParsedScenes.length} cảnh & tổng hợp giọng đọc (${selectedVoiceObj.name}, ${speed}×)...`,
    ]);
    setCreationStep(1);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scriptTitle || 'Video Stickman Mới',
          subtitle: scriptSubtitle || `Giọng đọc ${speed}×`,
          voice: selectedVoice,
          speed,
          content: textContent,
          scenes: rawParsedScenes,
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${response.status})`);
      }

      setCreationLogs((prev) => [
        ...prev,
        '✓ Audio đã tạo xong & đo chính xác thời lượng từng phân cảnh',
        '[2/3] Phân tích ngữ nghĩa, ngắt câu đổi ý & tạo kho ảnh Stickman theo mốc thời gian audio...',
      ]);
      setCreationStep(2);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Tạo video không thành công.');
      }

      const multiBeatScenes = buildMultiBeatScenes(data.scenes);
      let totalBeatsCount = 0;
      multiBeatScenes.forEach((s) => {
        totalBeatsCount += s.beats ? s.beats.length : 1;
      });

      setCreationLogs((prev) => [
        ...prev,
        `✓ Đã tạo ${totalBeatsCount} hình ảnh Stickman 1080p khớp theo từng nhịp ngắt ý`,
        '[3/3] Ghép nối Remotion & render video MP4 hoàn tất, nạp vào Player...',
      ]);
      setCreationStep(3);

      setCreationSuccess(true);
      await new Promise((r) => setTimeout(r, 600));
      onGenerateNewVideo(multiBeatScenes, data.metadata);
      setIsCreating(false);
    } catch (err: any) {
      console.error('Error generating video:', err);
      setErrorMessage(err.message || 'Lỗi trong quá trình tạo video. Vui lòng thử lại.');
      setIsCreating(false);
    }
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
            opacity: isCreating ? 0.6 : 1,
          }}
        >
          {isCreating ? (
            <>
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid var(--text-inverse)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              Đang xử lý...
            </>
          ) : (
            <>
              <Zap style={{ width: 16, height: 16 }} />
              Tạo Video
            </>
          )}
        </button>
      </div>

      {/* Creation Progress Modal */}
      {isCreating && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
          }}
          className="animate-fade-in"
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 32,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              {creationSuccess ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <Zap style={{ width: 24, height: 24, color: 'var(--accent)' }} />
              )}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {creationSuccess ? 'Hoàn tất!' : 'Đang tạo video...'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 20px' }}>
              {creationSuccess ? 'Video sẽ phát ngay sau đây' : 'Phân cảnh, sinh ảnh stickman, nạp Remotion'}
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                <span>Tiến trình</span>
                <span className="mono" style={{ color: 'var(--accent)' }}>
                  {creationSuccess ? '100%' : `${Math.round((creationStep / 3) * 100)}%`}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: 'var(--bg-base)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${creationSuccess ? 100 : (creationStep / 3) * 100}%`,
                    background: creationSuccess ? 'var(--success)' : 'var(--accent)',
                    borderRadius: 99,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>
            </div>

            {/* Logs */}
            <div
              className="mono"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                maxHeight: 120,
                overflow: 'auto',
                textAlign: 'left',
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              {creationLogs.map((log, idx) => (
                <p
                  key={idx}
                  style={{
                    margin: 0,
                    color: idx === creationLogs.length - 1 ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: idx === creationLogs.length - 1 ? 600 : 400,
                  }}
                >
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
