# Kiểm tra lập kế hoạch qua Google AI Studio, 11/10/2026

Phần chia cảnh, chia ảnh, viết ý tưởng/prompt và review dùng Playwright trên Google AI Studio, model `gemini-3.8-flash`. Không gọi Gemini REST API hoặc OpenAI API để lập kế hoạch. Model được xác nhận trên giao diện trước khi gửi đầy đủ ngữ cảnh và JSON schema. Mỗi yêu cầu mở chat mới; các công cụ tìm kiếm và schema lưu từ chat trước được tắt để tránh làm lệch đầu ra.

## Kiểm tra tự động

PASS: 33 test trong `aiPlanningClient`, `aiProductionPlanner`, `projectEditor`, `audioAlignment`, `visualBeatPlanner` và `image-generation/modelFallback`.

Test Playwright dùng trang mô phỏng để kiểm tra phản hồi đang chạy, nút Run bị khóa sau khi hoàn tất, chỉ đọc câu trả lời của model, JSON thiếu/sai kiểu, model không đúng, lỗi nội bộ, quota, timeout và giải phóng tab. Test planner kiểm tra bảo toàn lời thoại, ngữ cảnh đầy đủ, AI sửa sau lỗi JSON và không lặp lại khi cần đăng nhập.

PASS: `npm run lint`, `npm run build`, `node scripts/image-density-ui.test.cjs`, `git diff --check`. Build vẫn cảnh báo bundle lớn hơn 500 kB.

## Kiểm tra trên Google AI Studio thật

Kịch bản mẫu 15 từ: “Một chú chim nhặt cành cây. Nó mang cành cây về tổ để xây tổ.”

PASS: Gemini 3.8 Flash chia thành 2 cảnh, tạo 2 prompt ảnh và review riêng cho storyboard cùng từng cảnh. Ghép lại lời thoại giữ nguyên 15 từ. Ý tưởng lần lượt là chim nhặt cành cây và đưa cành vào tổ; cùng nhân vật nâu/xanh và phong cách watercolor, không chữ. Bằng chứng review trích đúng lời thoại của từng cảnh. Kết quả lưu tại [ai-studio-planning-sample.json](ai-studio-planning-sample.json).

Google AI Studio có một lần báo lỗi nội bộ; lần thử lại bằng chat mới thành công, được ghi trong `providerFailures`. Lỗi này có thể tái diễn; client chỉ thử lại lỗi nội bộ một lần rồi báo lỗi, không chuyển sang API.

PASS: mẫu bổ sung một cảnh dài 12 giây, mật độ dense, được Gemini 3.8 chia thành 4 ảnh với thời lượng 2,8 / 2,8 / 2,4 / 4 giây, tổng 360 frame. Bốn prompt lần lượt minh họa nhặt cành, ngậm cành dưới gốc cây, bay lên và đặt cành vào tổ. AI review đạt, lời thoại giữ nguyên. Một ranh giới vẫn cắt giữa câu ở cụm “dưới gốc cây”; hình tương ứng có đúng bối cảnh nhưng nhịp cắt nên được người dùng xem lại. Lần thử nhiều ảnh trước đó đã dừng sau hai lỗi nội bộ liên tiếp; cả kết quả và lỗi được lưu trong `multi_image_test` của báo cáo JSON.

Thời lượng thử là dữ liệu ước tính. Chưa tạo ảnh hoặc render video thật trong lần kiểm tra này; kết quả không xác nhận chất lượng pixel hoặc căn khớp audio của dự án hiện tại. Báo cáo `ai-planning-validation.md` và `ai-planning-sample.json` là dữ liệu lịch sử của bản API trước đó.
