# Cập nhật vận hành 23/10/2026

Theo yêu cầu hiện hành, giữ duyệt storyboard, chưa thay đổi TTS và không kiểm duyệt hình ảnh cuối:

- Sau duyệt, dựng vector, kiểm tra schema rồi xuất MP4 trực tiếp. Không gửi ảnh render sang ChatGPT để chấm/sửa, không xuất animatic hoặc review packet tự động.
- Metadata ghi `quality_review.status: not_reviewed`; xuất thành công không đồng nghĩa đã kiểm duyệt hình ảnh.
- Mỗi cảnh có tối đa 6 yêu cầu sinh/sửa; đọc bản nháp lưu sẵn không chiếm một lượt. Sửa trường thất bại lặp lại sẽ chuyển sang dựng lại cảnh theo hợp đồng đã duyệt, vẫn kiểm tra schema và tái sử dụng set.
- Giữ cache các cảnh đã hoàn thành khi tác vụ thất bại. Tiếp tục dựng dùng lại chúng, thử lại phần còn thiếu.
- Yêu cầu dừng được truyền vào render MP4 và thumbnail. Bản MP4 hoàn chỉnh trước đó được giữ khi hủy render.
- Lỗi đăng nhập, mạng hoặc dữ liệu vẫn có thể làm tác vụ thất bại sau số lượt thử hữu hạn; không bỏ qua schema để xuất một cảnh không hợp lệ.

Các mô tả kiểm duyệt tự động bên dưới là lịch sử, không còn áp dụng cho luồng dựng mặc định.

# Flow trước cập nhật: visual-evidence-flow-v1

Xem [nghiên cứu tham chiếu và giới hạn kiểm chứng](REMOTION_REFERENCE_STUDY.md).

Từ 23/10/2026, storyboard mới dùng hợp đồng ý nghĩa thị giác, kiểm tra ý tưởng trước khi duyệt, biên dịch nhịp đã duyệt, set dùng chung và kiểm tra ảnh render đính kèm trước khi xuất. Trạng thái `sampled_frames_passed` không phải chứng nhận toàn bộ chuyển động. Các mục phía dưới là lịch sử thay đổi; quy tắc mới ở đầu tài liệu có ưu tiên.

# Scene Director Skill — quy tắc hiện hành

Skill của project: `.agents/skills/remotion-scene-director/SKILL.md`. Runtime đọc nội dung và gửi trực tiếp cho ChatGPT.

- Thay quy tắc 5–9 giây trước đây bằng 2–6 giây/cảnh, ưu tiên khoảng 4–6 giây và một chuỗi hành động liên tục. Ví dụ audio 45,33 giây mặc định khoảng 10 cảnh, không 36 shot.
- JSON theo cấu trúc metadata/scenes của người dùng: cast, locations, camera, visual_action, character_states, vfx, audio và component suggestion.
- Nhân vật/bối cảnh phải khai báo trước. Các ví dụ Comfort Zone/shadow/15 cảnh không bị áp dụng cho mọi chủ đề.
- Gom lỗi để sửa một lượt, giữ trường hợp lệ. ID/frame count được chuẩn hóa; lời đọc thiếu/thừa nhẹ được phân bổ lại theo nguồn, không làm mất lời.
- Scene List dùng 30fps; Remotion hiện tại vẫn render 60fps và tính frame từ giây. Không thực thi component suggestion như code.
- Audio nhập được giữ nguyên; mốc cảnh tự động được giới hạn 2–6 giây. Thời lượng TTS trên storyboard là ước tính cho tới khi sinh audio.
- Người dùng duyệt/sửa camera, tư thế, biểu cảm, VFX, chỉ dẫn SFX/nhạc; tải JSON ở `/api/storyboard/:id/export`. VFX là yêu cầu dựng hình, SFX/nhạc hiện mới là chỉ dẫn, chưa tự tổng hợp/trộn âm.
- Dừng ở bản nháp để người dùng duyệt trước khi dựng. Bản nháp cũ giữ nguyên; tạo mới dùng skill mới.

Các phần bên dưới ghi lại flow trước khi áp dụng skill; quy tắc hiện hành ở trên được ưu tiên.

---

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

## Duyệt storyboard trước khi dựng

Luồng Remotion mặc định trả về bản nháp sau khi chia cảnh và căn audio. Máy chủ chưa gọi thiết kế chuyển động hoặc render ở giai đoạn này.

Trong màn hình duyệt: xem sơ đồ ý tưởng, timecode, lời đọc và audio; sửa tên cảnh, bối cảnh, chủ thể, đạo cụ, vị trí ngang, mô tả và chuỗi hành động. Sơ đồ là bản phác bố cục, không phải frame render. Thời lượng TTS được ghi là ước tính.

Bản nháp lưu tại `data/storyboard-drafts/`; trình duyệt nhớ ID để mở lại. Lời đọc và phân đoạn audio giữ nguyên khi sửa hình. Lưu dùng revision để tránh ghi đè bản mới; duyệt khóa đúng revision rồi mới dựng. Các chỉ dẫn đã duyệt được truyền nguyên vẹn cho director. Không gửi file local cho ChatGPT.

### Đầu vào theo skill

Trong chế độ Remotion, chọn “Kịch bản — giữ lời đọc” hoặc “Ý tưởng — phát triển thành câu chuyện”. Hệ thống tự chọn số cảnh theo thời lượng lời đọc; không cần nhập số cảnh. Nếu dùng audio có sẵn thì luôn giữ lời gốc và kiểm tra giới hạn 2–6 giây. Lời đọc do AI phát triển từ ý tưởng được chỉnh sửa tại màn hình duyệt. Thay đổi nội dung skill tạo cache mới; bản đã duyệt vẫn dùng kế hoạch đã lưu.

## Kiểm chứng chuyển động — 23/10/2026

- Planner chọn số cảnh trong khoảng phù hợp audio và nhịp 2–6 giây; không chốt bằng thời lượng / 4,5. Ranh giới audio người dùng chọn vẫn được giữ.
- Rig tay dùng hai đoạn 110 đơn vị, giới hạn tầm với; attachment dùng cùng điểm bàn tay đã giới hạn.
- walking:true lấy chu kỳ bước theo quãng đường x ở scale cố định: chân trụ giữ vị trí thế giới, chân vung nhấc khỏi sàn. Không animate y/scale trong bước đi.
- Cảnh mẫu 6 giây: đi → dừng → với tay → nhấc cốc → nhìn cốc. Chạy `node scripts/render-motion-proof.cjs`; kết quả ở `reports/motion-proof/motion-proof.mp4`.
- Kiểm chứng này chưa bao phủ ngồi, xoay người, chạy, địa hình hoặc thay đổi scale khi đi. Video do AI tạo vẫn cần kiểm tra hình ảnh thực tế; chưa có cổng đánh giá thị giác tự động.

### Sửa lại tư thế sau phản hồi

Bản `motion-proof` đầu tiên bị loại vì tay quá dài, chân khuỵu và hướng cơ thể không khớp hướng đi. Bản thay thế nằm ở `reports/motion-proof-v2/motion-proof.mp4`.

Thêm tư thế nghiêng `facing: 1 | -1` cho character (0/không có giữ rig cũ). Tay nghiêng dài 82+78, bàn tay nghỉ ngang hông; chân 95+95, chiều cao hông được tính theo chân trụ. Chu kỳ bước 140 đơn vị, mỗi bước 70. Góc nghiêng hiện là mẫu người tối giản, chưa hỗ trợ đầy đủ trang phục/biểu cảm của rig chính diện; chỉ chọn khi phù hợp nhân vật đã duyệt.
