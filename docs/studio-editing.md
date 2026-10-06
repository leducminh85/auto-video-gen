# Chỉnh ảnh, nhập audio và đổi phong cách

## Chỉnh ảnh sau khi tạo video

Studio chia thành ba phần: **Xem trước**, **Phân cảnh** và **Chi tiết cảnh**. Chọn cảnh ở danh sách rồi chỉnh ảnh trên timeline trong phần Chi tiết cảnh.

Timeline có track audio với waveform từ tệp thật và track ảnh với thumbnail. Chọn một ảnh để xem bản lớn bên dưới. Các nút đơn giản dùng icon; rê chuột để xem tên thao tác.

- Kéo thân ảnh sang trái/phải để đổi thứ tự. Mỗi ảnh giữ thời lượng khi đổi vị trí.
- Kéo mép giữa hai ảnh để chỉnh thời gian. Thời gian tăng ở ảnh này được lấy từ ảnh liền kề; tổng thời lượng audio của cảnh giữ nguyên. Mỗi ảnh luôn có ít nhất một frame.
- Có nút phóng to, thu nhỏ và vừa khung. Cuộn ngang để xem phần timeline còn lại; khi kéo sát mép vùng nhìn, timeline tự cuộn.
- Có thể nhập số giây của ảnh được chọn. Khi focus mép ảnh, phím trái/phải chỉnh một frame, Shift chỉnh mười frame; Home/End đưa mép tới giới hạn. Alt + trái/phải trên ảnh đổi thứ tự. Các nút mũi tên cung cấp thao tác tương đương.
- Thả chuột để lưu; Esc hủy lần kéo. Lưu lỗi sẽ khôi phục timeline trước khi chỉnh. Bấm thước thời gian hoặc waveform để tua preview.


- **Thêm ảnh vào cảnh**: chọn vị trí **Chèn sau ảnh**, viết nội dung ảnh, bấm **Tạo ảnh mới** rồi **Thêm vào cảnh**. Phong cách của video nằm trong phần mở rộng và có thể sửa riêng cho ảnh mới.
- **Xóa ảnh**: bỏ ảnh khỏi cảnh. Cảnh luôn giữ ít nhất một ảnh.
- Thêm ảnh chia thời gian của ảnh được chọn thành hai phần. Xóa ảnh chuyển thời gian cho ảnh liền trước, hoặc ảnh đầu tiên còn lại nếu xóa ảnh đầu. Các ảnh khác, audio và tổng thời lượng cảnh giữ nguyên.
- **Hoàn tác** phục hồi lần chỉnh gần nhất trong phiên hiện tại. Các tệp ảnh cũ được giữ để có thể phục hồi.
- Thay đổi được lưu trên máy chủ vào `public/scenes.json` và xuất hiện khi tải lại trang. Bấm **Xuất và tải MP4** để ghép lại và tải bản mới trong một thao tác. Nếu chưa chỉnh sửa, nút **Tải MP4** tải ngay bản hiện tại.

Phần này chỉnh các ảnh bên trong cảnh lời thoại; không xóa đoạn lời thoại/audio khỏi video.

## Dùng audio có sẵn

Trong **Tạo video mới**, chọn **Nhập audio có sẵn**, chọn tệp và nghe thử. Hỗ trợ định dạng FFmpeg đọc được, gồm MP3, WAV, M4A, OGG và FLAC, tối đa 100 MB và 120 phút.

Nhập kịch bản tương ứng. Mỗi đoạn cách nhau một dòng trống là một cảnh. Có thể dùng cú pháp `CẢNH 1: Tiêu đề` hoặc nhập JSON phân cảnh.

Mặc định ứng dụng ước lượng thời điểm chuyển cảnh theo số từ. Bật **Tự đặt thời điểm chuyển cảnh** để chỉnh từng mốc kết thúc. Nghe audio rồi dùng **Lấy vị trí đang nghe**, hoặc nhập số giây ở dòng tương ứng. Mốc của cảnh sau phải lớn hơn cảnh trước và nhỏ hơn thời lượng audio. Ứng dụng chưa nhận dạng lời nói hay tự căn theo câu. Audio nhập giữ nguyên tốc độ và không gọi TTS.

Tệp được chuyển sang WAV rồi cắt theo mốc frame. Tệp đã nhập, nguồn âm thanh và mốc cắt được ghi nhớ cùng bản nháp khi đóng form hoặc tải lại trang. Nếu tệp trên máy chủ không còn, form báo lỗi và cho chọn lại.

## Prompt phong cách

Mục **Phong cách hình ảnh** hiện bản xem nhanh của prompt đang dùng. Mở **Xem và sửa prompt** để sửa trực tiếp hoặc dùng **Khôi phục phong cách mặc định**. Prompt được lưu trong bản nháp trình duyệt và metadata của video tạo mới; nội dung từng cảnh được ghép với phong cách này trước khi gửi đến dịch vụ tạo ảnh. FLUX không còn tự thêm phong cách stickman hoặc bộ lọc loại trừ ảnh thật.

Đổi prompt trong form tạo mới không tự tạo lại ảnh của video hiện tại. Ảnh mới thêm vào cảnh dùng phong cách đã lưu của video; mô tả trong hộp tạo ảnh vẫn sửa được.

## Kiểm tra

- `npm run lint`
- `npm run build`
- `node --test scripts/projectEditor.test.cjs scripts/visualBeatPlanner.test.cjs`
- `node scripts/studio-ui.test.cjs`
- `node scripts/studio-editor.test.cjs`
- `node scripts/studio-ux.test.cjs`
- `node scripts/studio-timeline.test.cjs`
- `node --import tsx --test scripts/beatEditing.test.ts`

Các bài kiểm tra trình duyệt dùng server mặc định `http://localhost:3001` (đổi bằng `STUDIO_URL`) và giả lập API ghi dữ liệu. Kiểm tra backend dùng FFmpeg thật với tệp trong thư mục tạm, gồm nhập/cắt audio, ghép lại MP4 và luồng tạo video từ audio không qua TTS. Dịch vụ tạo ảnh được thay bằng ảnh thử, không gọi AI trực tiếp.

Giao diện giữ bảng màu tối/amber, focus bàn phím và các trạng thái đang xử lý/lỗi. Kiểm tra responsive ở 320, 390, 768 và 1440 px; ảnh chụp giao diện cũng được xem lại.
