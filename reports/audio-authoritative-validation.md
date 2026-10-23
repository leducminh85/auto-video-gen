# Audio là nguồn lời thoại, 11/10/2026

Khi nhập audio, hệ thống nhận dạng lời nói và mốc từ bằng faster-whisper. Lời thoại này là nguồn để AI chia cảnh, chia ảnh, viết prompt và review. Kịch bản người dùng nhập được truyền riêng dưới dạng `referenceScript`, chỉ để hiểu chủ đề; các câu không được nói trong bản thu không được thêm vào video. Kịch bản tham khảo có thể để trống. Chế độ tạo giọng đọc vẫn sử dụng kịch bản người dùng làm lời thoại.

## Kết quả kiểm tra

- PASS: 19 Node test, 5 Python test, lint và build. Build vẫn có cảnh báo bundle trên 500 kB.
- PASS: Playwright UI kiểm tra nhập audio với kịch bản trống vẫn gửi yêu cầu tạo video; chuyển sang TTS thì phải có lời thoại. Mốc cắt từ kịch bản tham khảo không được gửi lên. Kiểm tra mật độ ảnh, lỗi stream và giao diện rộng 390 px vẫn qua.
- PASS: fixture toàn pipeline dùng audio nói “A bird carries a twig. It builds a nest.” với kịch bản tham khảo “A bird wins a trophy.”. Lời thoại đầu ra chỉ gồm câu từ audio; ngữ cảnh tham khảo được gửi riêng vào tất cả lượt lập kế hoạch và review. Audio không nhận dạng được sẽ dừng trước khi gọi AI và không thay dự án cũ.
- PASS: file audio thật của dự án được nhận dạng thành 411 từ. Gemini 3.8 Flash qua Google AI Studio/Playwright chia thành 7 cảnh và review đạt. Ghép 7 cảnh khôi phục nguyên văn bản nhận dạng; cả 7 cảnh căn được với timestamp của audio. Kết quả trong [audio-authoritative-planning.json](audio-authoritative-planning.json).

## Phạm vi và giới hạn

PASS: đoạn về cộng đồng từng gây lỗi đã được Gemini lập thành 2 ảnh và review đạt. Căn theo audio thật cho thời lượng khoảng 5,67 và 5,47 giây, đều nằm trong giới hạn nhịp balanced. Không thêm lại hai câu chỉ có trong kịch bản tham khảo.

Chỉ kiểm tra lập kế hoạch và thời gian, chưa tạo ảnh hay render video thật. Độ khớp 1,0 đo việc đối chiếu với bản nhận dạng, không chứng minh nhận dạng chính xác từng chữ. Bản nhận dạng hiện còn một số lỗi chính tả như “đặt” thay vì “đắt”, “đất ngọt” thay vì “nước ngọt”; AI được cung cấp kịch bản tham khảo để hiểu ngữ cảnh, nhưng không được tự thêm câu không có trong audio. Bản thu gốc và dự án hiện tại không bị ghi đè trong lần thử này.

## Kiểm tra giao diện

PASS: giữ bố cục, bảng màu studio tối và accent hiện có; chỉ đổi nhãn/ngữ cảnh nhập liệu và bỏ điều khiển cắt theo kịch bản tham khảo. Điều kiện bật nút Tạo video đã được kiểm tra cho cả nguồn audio và TTS; kiểm tra giao diện di động qua Playwright đạt.
