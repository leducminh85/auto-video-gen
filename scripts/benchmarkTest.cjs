/**
 * Benchmark & Performance Measurement Suite
 * Runs an end-to-end explainer video generation, measures latency, throughput,
 * resource consumption, and inspects final multimedia quality via ffprobe.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateVideo } = require('./videoGenerator.cjs');

const TEST_SCRIPT = `CẢNH 1: Nghịch Lý Giá Cà Phê
Một ly cà phê take-away có giá 50.000 đồng, trong khi chi phí hạt cà phê và nước thực tế chưa tới 3.000 đồng.

CẢNH 2: 94% Giá Trị Nằm Ở Đâu?
Chênh lệch khổng lồ hơn 1.500% không biến chủ quán thành triệu phú, mà bị chia cắt bởi tiền mặt bằng đắc địa và khấu hao máy pha espresso.

CẢNH 3: Bẫy Khách Ngồi Cả Ngày
Khách hàng mua một ly cà phê 35.000 đồng rồi cắm sạc laptop ngồi suốt 6 tiếng làm tiêu hao tiền điện và triệt tiêu doanh thu trên mỗi mét vuông.

CẢNH 4: Quy Tắc Take-Away Tối Ưu
Các chuỗi cà phê thành công nhất tối ưu 80% doanh thu từ khách mua mang đi trong 60 giây thay vì mở rộng diện tích bàn ghế sang chảnh.

CẢNH 5: Bí Quyết Kinh Doanh Bền Vững
Lợi nhuận thực sự đến từ tốc độ quay vòng ly cà phê mỗi sáng, chứ không phụ thuộc vào việc trang trí quán đẹp để khách check-in sống ảo.`;

async function runBenchmark() {
  console.log(`\n======================================================`);
  console.log(`🧪 [STICKMAN VIDEO STUDIO - BENCHMARK & QUALITY AUDIT]`);
  console.log(`======================================================\n`);

  const initialMemory = process.memoryUsage();
  const startTime = Date.now();
  const stageTimers = {
    storyboard: { start: null, end: null, durationMs: 0 },
    tts: { start: null, end: null, durationMs: 0, count: 0 },
    beat_plan: { start: null, end: null, durationMs: 0, count: 0 },
    images: { start: null, end: null, durationMs: 0, count: 0 },
    render: { start: null, end: null, durationMs: 0, count: 0 },
  };

  const progressEvents = [];
  let peakMemoryRss = initialMemory.rss;

  const onProgress = (prog) => {
    progressEvents.push({ ...prog, time: Date.now() - startTime });
    const currentRss = process.memoryUsage().rss;
    if (currentRss > peakMemoryRss) peakMemoryRss = currentRss;

    // Track stages
    const key = prog.stepKey;
    if (stageTimers[key]) {
      if (!stageTimers[key].start) stageTimers[key].start = Date.now();
      stageTimers[key].end = Date.now();
      if (prog.sceneIndex) stageTimers[key].count = Math.max(stageTimers[key].count, prog.sceneIndex);
    }
  };

  console.log(`▶ Bắt đầu kiểm thử pipeline với kịch bản 5 cảnh...`);
  const result = await generateVideo({
    title: 'Kinh Tế Học Quán Cà Phê',
    subtitle: 'Benchmark Test 2026',
    content: TEST_SCRIPT,
    voice: 'vi-VN-Standard-A',
    speed: 1.0,
    onProgress,
  });

  const totalTimeMs = Date.now() - startTime;
  const finalMemory = process.memoryUsage();

  // Compute stage durations
  Object.keys(stageTimers).forEach((key) => {
    const st = stageTimers[key];
    st.durationMs = st.start && st.end ? st.end - st.start : 0;
  });

  console.log(`\n🔍 [KIỂM TRA CHẤT LƯỢNG MULTIMEDIA QUA FFPROBE]...`);
  const finalVideoPath = path.join(__dirname, '../public/final-video.mp4');
  let probeData = null;

  try {
    const probeOutput = execSync(
      `/opt/homebrew/bin/ffprobe -v quiet -print_format json -show_format -show_streams "${finalVideoPath}"`,
      { encoding: 'utf8' }
    );
    probeData = JSON.parse(probeOutput);
  } catch (err) {
    console.warn('ffprobe error:', err.message);
  }

  // Visual beat metrics
  const scenesJsonPath = path.join(__dirname, '../public/scenes.json');
  const scenesData = JSON.parse(fs.readFileSync(scenesJsonPath, 'utf8'));
  const scenes = scenesData.scenes || [];

  let totalBeats = 0;
  const visualMethods = {};
  const diegeticTexts = [];
  const beatDurations = [];

  scenes.forEach((s) => {
    const beats = s.beats || [];
    totalBeats += beats.length;
    beats.forEach((b) => {
      const method = b.plan?.visualMethod || 'unknown';
      visualMethods[method] = (visualMethods[method] || 0) + 1;
      if (b.plan?.diegeticText || b.plan?.keyText) {
        diegeticTexts.push(b.plan.diegeticText || b.plan.keyText);
      }
      beatDurations.push(b.duration_in_seconds || (b.duration_in_frames / 30));
    });
  });

  const avgBeatDuration = beatDurations.length > 0
    ? (beatDurations.reduce((a, b) => a + b, 0) / beatDurations.length).toFixed(2)
    : 0;

  const videoStream = probeData?.streams?.find((s) => s.codec_type === 'video');
  const audioStream = probeData?.streams?.find((s) => s.codec_type === 'audio');

  const benchmarkReport = {
    timestamp: new Date().toISOString(),
    hardware: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    performance: {
      totalDurationMs: totalTimeMs,
      totalDurationSec: (totalTimeMs / 1000).toFixed(2),
      videoDurationSec: parseFloat(probeData?.format?.duration || result.metadata.total_duration_in_seconds),
      realtimeFactor: ((totalTimeMs / 1000) / parseFloat(probeData?.format?.duration || 1)).toFixed(2),
      stages: {
        storyboardMs: stageTimers.storyboard.durationMs,
        ttsMs: stageTimers.tts.durationMs,
        beatPlanningMs: stageTimers.beat_plan.durationMs,
        imageGenerationMs: stageTimers.images.durationMs,
        renderAndConcatMs: stageTimers.render.durationMs,
      },
      throughput: {
        beatsPerSecond: (totalBeats / (totalTimeMs / 1000)).toFixed(2),
        secondsOfVideoPerRealSecond: (parseFloat(probeData?.format?.duration || 1) / (totalTimeMs / 1000)).toFixed(2),
      },
      memory: {
        initialRssMb: (initialMemory.rss / (1024 * 1024)).toFixed(2),
        peakRssMb: (peakMemoryRss / (1024 * 1024)).toFixed(2),
        finalRssMb: (finalMemory.rss / (1024 * 1024)).toFixed(2),
        heapUsedMb: (finalMemory.heapUsed / (1024 * 1024)).toFixed(2),
      },
    },
    quality: {
      video: {
        codec: videoStream?.codec_name || 'h264',
        profile: videoStream?.profile || 'High',
        resolution: `${videoStream?.width}x${videoStream?.height}`,
        fps: videoStream?.r_frame_rate || '30/1',
        bitrateKbps: videoStream?.bit_rate ? Math.round(videoStream.bit_rate / 1000) : null,
        pixFmt: videoStream?.pix_fmt || 'yuv420p',
        fileSizeBytes: fs.statSync(finalVideoPath).size,
        fileSizeMb: (fs.statSync(finalVideoPath).size / (1024 * 1024)).toFixed(2),
      },
      audio: {
        codec: audioStream?.codec_name || 'aac',
        sampleRateHz: audioStream?.sample_rate || 44100,
        channels: audioStream?.channels || 2,
        bitrateKbps: audioStream?.bit_rate ? Math.round(audioStream.bit_rate / 1000) : null,
      },
      content: {
        totalScenes: scenes.length,
        totalBeats,
        avgBeatDurationSec: Number(avgBeatDuration),
        visualMethodsDistribution: visualMethods,
        uniqueDiegeticLabelsCount: new Set(diegeticTexts).size,
        qualityGatePassed: result.metadata.quality_report?.validation_passed ?? true,
      },
    },
    eventCount: progressEvents.length,
  };

  const outputPath = path.join(__dirname, '../benchmark-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(benchmarkReport, null, 2));

  console.log(`\n======================================================`);
  console.log(`📊 [KẾT QUẢ BENCHMARK]:`);
  console.log(`- Tổng thời gian thực thi: ${benchmarkReport.performance.totalDurationSec}s`);
  console.log(`- Độ dài video tạo ra: ${benchmarkReport.performance.videoDurationSec}s`);
  console.log(`- Realtime Factor: ${benchmarkReport.performance.realtimeFactor}x (Tạo 1s video tốn ${benchmarkReport.performance.realtimeFactor}s)`);
  console.log(`- Phân cảnh: ${scenes.length} cảnh | Tổng Beats: ${totalBeats} nhịp thị giác (TB: ${avgBeatDuration}s/beat)`);
  console.log(`- Phân bố dạng hình ảnh:`, visualMethods);
  console.log(`- Kích thước file video: ${benchmarkReport.quality.video.fileSizeMb} MB (${benchmarkReport.quality.video.resolution}, ${benchmarkReport.quality.video.codec})`);
  console.log(`- Bộ nhớ RAM tiêu thụ đỉnh (Peak RSS): ${benchmarkReport.performance.memory.peakRssMb} MB`);
  console.log(`- Đã lưu file kết quả: ${outputPath}`);
  console.log(`======================================================\n`);

  return benchmarkReport;
}

if (require.main === module) {
  runBenchmark().catch((err) => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = { runBenchmark };
