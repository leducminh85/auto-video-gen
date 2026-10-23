# Kiểm tra luồng AI lập kế hoạch, 11/10/2026

> Báo cáo lịch sử của bản dùng API. Luồng hiện tại dùng Google AI Studio qua Playwright; các model dự phòng API bên dưới không còn là cấu hình đang chạy.

Luồng tạo video đã chuyển sang `aiProductionPlanner.cjs`: AI chọn điểm chia cảnh, điểm chia ảnh, ý tưởng và prompt. Code bảo toàn lời thoại, kiểm tra cấu trúc và nhịp ảnh; một lượt AI riêng đánh giá từng phương án. Kết quả không đạt được gửi lại AI để sửa, tối đa ba lần, sau đó báo lỗi. Luồng tạo video không dùng kế hoạch cục bộ thay thế.

## Kiểm tra bằng API thật

[Kế hoạch mẫu và kết quả kiểm tra audio](ai-planning-sample.json) dùng toàn bộ 447 từ trong dự án hiện có, tạo 6 cảnh và 24 prompt ảnh. Đối chiếu lời thoại sau khi ghép các ảnh xác nhận không mất, lặp hay đảo từ. Thời lượng trong phần kế hoạch là ước tính; báo cáo không chứa ảnh đã vẽ.

Gemini 3.8 Flash có trong danh sách model của key hiện tại nhưng các lệnh tạo nội dung đã timeout. Gemini 3 Flash Preview và 3.5 Flash trả được một số kế hoạch, sau đó gặp 429/503. Gemini 3.1 Pro Preview trả 429. Gemini 3.1 Flash Lite hoàn thành kế hoạch mẫu và các lượt sửa; đây là model dự phòng mặc định. Model chính vẫn là `gemini-3.8-flash`; có thể đổi bằng biến môi trường trong `.env.example`.

Đọc thủ công các lượt đầu phát hiện những lỗi mà AI review có lúc bỏ lọt: tự thêm hàng khách chờ, biểu đồ tăng trưởng không có số liệu, cắt giữa cụm “khá đắt”, prompt chỉ có người chỉ vào tường trống. Đã bổ sung kiểm tra trực tiếp cho hàng chờ không có trong lời thoại, biểu đồ thiếu số liệu, điểm cắt làm đứt cụm ý và thời lượng vượt mật độ đã chọn. Các cảnh 2, 3 và 6 trong mẫu cuối được AI sửa theo nhận xét đọc thủ công, lưu ở `manual_review.feedback`.

Kết quả vẫn cần người xem duyệt trước khi xuất bản. Một số hình còn diễn đạt gián tiếp: cảnh 2 dùng các linh kiện rời để nói về chi phí; cảnh 3 dùng ảnh riêng của máy tính cho ý khai thác tài sản. Lượt AI review không phải bằng chứng rằng mọi hình đều diễn đạt tốt, và chưa kiểm tra được chất lượng pixel vì chưa tạo ảnh.

## Audio thật chưa qua kiểm định

Đã chạy bộ căn lời đọc trên file audio đang dùng. Bộ căn không đạt ngưỡng khớp ở đoạn:

> Nhiều người không đến quán chỉ vì máy tính mạnh mà còn vì muốn chơi game cùng bạn bè.

Đây có thể là sai khác lời thoại hoặc lỗi nhận diện âm thanh; chưa xác định nguyên nhân bằng nghe đối chiếu. Báo cáo ghi `audio_validation.passed: false` và `ready_to_render: false`. Không thay video, dữ liệu dự án hay các tệp media hiện có. Luồng sản xuất sẽ dừng trước bước tạo ảnh khi gặp lỗi này.

## Kiểm tra tự động

- PASS: 28 test cho lập kế hoạch, bảo toàn lời thoại, kiểm định, sửa lỗi, provider dự phòng, chờ theo 429, căn frame, lưu và dựng video.
- PASS: test pipeline dùng audio và MP4 thật trong thư mục tạm; phản hồi AI và mốc nhận diện trong test này được mô phỏng.
- PASS: TypeScript (`npm run lint`) và build. Build còn cảnh báo chunk lớn hơn 500 kB.
- PASS: `image-density-ui.test.cjs` kiểm tra lưu lựa chọn, truyền toàn bộ lời thoại, gõ dấu cách, hiển thị lỗi AI qua luồng NDJSON và control vừa màn hình 390 px. Đã xem ảnh chụp mobile.
- Hai test UI rộng hơn chưa qua: `studio-ux.test.cjs` tìm nút “Chỉnh ảnh trong cảnh” không còn có trong UI; `studio-editor.test.cjs` chờ thông báo lỗi xuất video đang bị comment trong `App.tsx`. Các điểm này đã có ở commit trước và không thuộc phần đổi planner.

## Phạm vi antislop

- PASS, nội dung: phần hướng dẫn mới mô tả đúng việc AI chia cảnh, ngoại lệ mốc audio thủ công và trạng thái lỗi; không thêm tuyên bố về chất lượng ảnh đã vẽ.
- PASS, chức năng liên quan: test browser đã xác nhận gửi lời thoại và hiển thị lỗi, kể cả lỗi chứa chữ “JSON”.
- PASS, bố cục liên quan: control mật độ vừa viewport 390 px; không tạo layout, palette hay hiệu ứng mới trong thay đổi này.
