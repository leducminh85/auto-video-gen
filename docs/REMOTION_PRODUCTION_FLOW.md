# Cập nhật nhịp dựng: continuous-scene-v2

Theo yêu cầu ngày 23/10/2026: ưu tiên ít cảnh, hành động diễn ra liên tục bên trong cảnh.

- Phân cảnh theo tình huống; trần số cảnh là ceil(thời lượng audio / 6). Audio 45,33 giây có tối đa 8 cảnh. Không dùng image density để tăng số cut.
- Mỗi cảnh mới có đúng một shot xuyên suốt, một bố cục ổn định và 3–5 mốc hành động nối tiếp. Không chia shot theo từng cụm từ, không thêm insert/phản ứng độc lập.
- Audio quyết định thời lượng; các mốc hành động được trải trong cùng timeline. Chỉ cắt ở ranh giới tình huống.
- Storyboard nhiều shot được yêu cầu sửa trước khi tạo hình. Các bản cũ đang sửa có thể giữ cấu trúc đã duyệt qua resumeRevision.
- Cache v2 tách khỏi v1 để không lấy lại storyboard dày cut. Các phần đã đạt trong cùng lượt v2 vẫn được giữ.
- Prompt nêu kích thước phone preset, tỉ lệ khi cầm, gắn vật theo tay và trục xoay local. Đây là hướng dẫn sinh hình, không thay thế kiểm tra video đã render.
- Bản xuất luôn có trạng thái pending_visual_review cho đến khi thực sự được kiểm tra.

---

# Remotion production flow

Acceptance source: `REMOTION_OUTPUT_STANDARD.md`, copied verbatim from the user's `tro/outputs/KHUON-MAU-VIDEO-GIAI-THICH-2D.md`. Visual and motion references are preserved in `remotion-reference/`.

The generator transcribes imported audio, plans the story, prepares scene audio, requests a structured storyboard and a separate editorial review, aligns shot and event anchors with speech, then generates validated vector designs. Shot durations come from audio boundaries rather than relative weights. Every shot records its role, focal subject, meaning, incoming/outgoing state and timed events in `direction_plan`.

Production artifacts live in `data/remotion-runs/<uuid>/`: checkpoints, approved storyboard JSON, `animatic.mp4`, full-resolution `final-video.mp4`, project JSON and review images. The editor receives a project-specific copy of the rendered video. Generation no longer needs to overwrite the legacy public export.

The animatic currently freezes each authored vector shot at 45% of its duration while keeping the narration and cuts. It is generated after vector authoring. A separate early animatic approval stage before detailed animation is still required to implement the complete proposed workflow.

The review packet contains shot boundary frames, representative frames and frames around narrated events. Its checklist remains pending until the rendered evidence is inspected. Editorial review evaluates the plan only. Neither a valid schema nor a successful render constitutes visual approval. This version does not yet automatically repair rendered defects or provide a complete tested motion-preset library.

Verification:

```sh
npm run lint
node --test scripts/remotionDirection.test.cjs scripts/remotion.test.cjs scripts/remotion-motion.test.cjs
node scripts/remotion-render-smoke.cjs
node scripts/remotion-review-packet.cjs <project-json> <video-mp4> <review-directory>
```
