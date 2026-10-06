# Wevic Video Studio UI review

Direction: a working video editor with dark surfaces and one amber accent. ENERGY 1 / RHYTHM 2 / MOTION 1. The player is the editor's focal point; the script is the creator's focal point. The W mark is shared by the favicon and application headers. Existing playback, audio, file and refresh icons identify their corresponding actions.

## Changes

- Renamed browser metadata and visible branding to Wevic Video Studio; added a native SVG favicon.
- Persisted script, title, subtitle, voice and speed in browser storage. With no saved draft, the form starts from the current video's metadata and narration. Clearing the script is saved deliberately. Storage failures show a notice rather than crashing the form.
- Added an editable video title; removed the duplicate cancel action, fullscreen badge and repeated configuration summary.
- Removed purple gradients, colored glows and magic icons. Hid technical logs by default. Scene image cards now show narration; full prompts are expandable.
- Improved muted-text contrast, focus outlines, keyboard scene selection, native voice radio inputs, reduced-motion handling and small-screen layouts.
- Dialogs trap focus, support Escape when idle, restore focus and make the background inert. Fixed conditional React hooks in the image dialog by mounting its stateful content only while open.
- Disabled video creation for empty scripts and image application before a new image exists. Updated the saved image prompt in local state after applying. Clipboard and audio failures show feedback.

## Verification and delivery gate

- Hard gate PASS for the reviewed flows: browser regression covers draft restoration, reload, successful and failed generation, empty input, file import, tab navigation, image regeneration/application and repeated modal opening. Mutating API requests are mocked, so existing project assets are preserved.
- Purpose gate PASS: amber marks primary actions and selection; shadows distinguish overlays; operational icons identify playback, audio, files and regeneration. No new decorative gradients or fabricated claims.
- Liveliness PASS: the editor keeps player, scene strip and inspector hierarchy; the creator prioritizes the script; the same W icon identifies both screens. Motion is limited to feedback and progress, with a reduced-motion override.
- Craftsmanship PASS for checked states: TypeScript and production build pass; keyboard focus stays in dialogs and returns to the opener; responsive checks cover 320, 390, 768 and 1440px. Progress also checked at 320px without horizontal overflow.
- Contrast PASS for updated tokens: muted text `#a0a6b3` on card `#1c1d28` is 6.85:1; dark button text `#090a0f` on amber `#f59e0b` is 9.21:1, measured with the project's contrast checker.

Run `node scripts/studio-ui.test.cjs` against the development server (default `http://localhost:3001`, configurable with `STUDIO_URL`), then `npm run lint` and `npm run build`.

Live AI generation was not executed during UI verification. The build still reports its existing large-bundle advisory. This review is not a full WCAG conformance certification.

## Rà soát luồng chỉnh ảnh và nhập audio

Các vấn đề tìm thấy khi dùng bản bổ sung:

- Form đặt âm thanh và một prompt dài trước kịch bản; nội dung chính bị đẩy xuống dưới màn hình.
- Mốc audio nhập bằng chuỗi có dấu phẩy, không thấy quan hệ với từng cảnh; đóng form làm mất lựa chọn audio.
- Thêm ảnh dùng hộp tạo lại ảnh cũ, hiện ảnh cũ như thể đó là ảnh mới. Trên điện thoại, nút tạo nằm dưới vùng cuộn nhưng nút lưu đang khóa lại luôn hiện.
- Thêm ảnh chỉ nối cuối, còn thêm/xóa đều chia lại thời gian mọi ảnh, làm thay đổi cả các đoạn không liên quan.
- Chọn cảnh tự phát video. Hai thao tác ghép và tải MP4 tách rời, nút tải bị khóa sau chỉnh sửa.

Đã sửa:

- Kịch bản là cột chính; âm thanh và phong cách là cột cài đặt. Màn hình nhỏ xếp theo thứ tự nhập liệu, giảm chiều cao textarea. Prompt có bản xem nhanh và phần mở rộng để sửa.
- Mỗi cảnh có dòng mốc kết thúc riêng. Có nút lấy vị trí đang nghe; audio và mốc cắt được lưu trong bản nháp. Trường hợp tệp không còn nghe được có thông báo chọn lại.
- Hộp ảnh mới chỉ hiển thị ảnh sau khi tạo thành công. Tách mô tả nội dung khỏi phong cách khi thêm ảnh. Chân hộp thoại hiển thị hành động đúng bước: tạo, sau đó lưu. Sửa prompt sau khi tạo yêu cầu tạo lại; lưu lỗi giữ ảnh vừa tạo để thử lưu lại.
- Chọn vị trí chèn; chỉ chia thời gian của ảnh được chọn. Xóa chuyển thời gian cho ảnh liền kề. Có hoàn tác và kiểm tra bảo toàn tổng frame/audio.
- Chọn cảnh không tự phát; thêm lối tắt vào phần chỉnh ảnh và bộ chọn cảnh tại đó. Xuất và tải MP4 là một thao tác.

Kiểm tra: TypeScript, production build, các bài backend với FFmpeg trong thư mục tạm, ba luồng browser và unit test cho thời gian ảnh. Browser kiểm tra 320/390/768/1440px, focus, nút chính nằm trong viewport, khôi phục bản nháp, tạo/lưu lỗi và thử lại, và tải file sau khi render. Ảnh chụp desktop/mobile được xem lại. Các API ghi dữ liệu trong browser và dịch vụ tạo ảnh trong bài backend đều giả lập; không gọi AI tạo ảnh thật hoặc sửa media hiện có.


## Timeline trong Studio

Bố cục hiện tại gồm ba section có tiêu đề và số thứ tự: preview, danh sách cảnh, chi tiết cảnh. Desktop đặt danh sách cạnh preview và timeline toàn chiều ngang bên dưới; mobile xếp dọc, danh sách cảnh và timeline cuộn riêng.

Track audio dùng waveform giải mã từ tệp thật, có trạng thái tải/lỗi. Track ảnh có thumbnail rõ nội dung, viền amber cho ảnh chọn và ảnh xem lớn phía dưới. Kéo thân ảnh đổi thứ tự; kéo mép đổi thời lượng giữa hai ảnh liền kề, bảo toàn tổng frame. Các nút zoom giúp chỉnh chính xác mà không ép toàn bộ ảnh vào một vùng quá nhỏ. Preview hiển thị rõ ngay frame đầu thay vì gần đen khi dừng.

Các thao tác đơn giản dùng icon với tên truy cập và tooltip: phát/dừng, nghe audio, thêm/xóa ảnh, hoàn tác, zoom, nhập tệp, đóng và khôi phục prompt. Các thao tác tạo/lưu ảnh nhiều bước giữ nhãn mô tả.

Bài `studio-timeline.test.cjs` kiểm tra waveform thật từ WAV thử, kéo đổi thứ tự bằng chuột, kéo mép bằng chuột và cảm ứng, chỉnh bằng phím, nhập thời lượng, hủy bằng Escape, hoàn tác, lưu lỗi và tải lại. Kiểm tra 320/390/768/1440px không có tràn ngang trang; thumbnail dùng contain và ảnh được chọn có vùng xem lớn. API ghi dữ liệu được giả lập. Ảnh chụp desktop/mobile đã được xem lại.
