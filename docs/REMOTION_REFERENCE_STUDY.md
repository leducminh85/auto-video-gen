# Nghiên cứu tham chiếu và flow mới — 23/10/2026

Nguồn: [What If Your Reaction Time Was 10x Faster? — Ifverse](https://www.youtube.com/watch?v=MroF1XmHOZw).

Phạm vi khảo sát: đọc toàn bộ transcript xuất từ trình phát (7:12), xem các khung hình ở nhiều mốc và phát các đoạn đại diện. Đây không phải phép đo từng cut hay xác nhận công cụ tác giả đã dùng. Không lấy các bình luận đoán công cụ làm bằng chứng.

## Điều cần học

- Mở đầu bằng tình huống cụ thể rồi mới giải thích giả thuyết. Chuỗi ruồi/cốc tạo bằng chứng trước phần số liệu.
- Giải thích bằng đối chiếu có thể nhìn thấy: thao tác, khoảng cách, thời điểm, kết quả. Một nhãn số chỉ bổ sung cho hành động.
- Một tình huống dùng nhiều cỡ cảnh: toàn cảnh định vị không gian; trung cảnh cho tương tác; cận/insert phóng lớn bằng chứng; phản ứng cho ý nghĩa cảm xúc. Không bắt mọi khung phải đủ một chu trình hành động.
- Các ví dụ nâng dần hệ quả, sau đó có giới hạn và cái giá. Cao trào là lựa chọn giữa hai kết quả, không chỉ tăng cường độ hiệu ứng.
- Thiết kế set có lớp xa/gần, nguồn sáng và vùng hành động rõ. Nhân vật, đạo cụ, hướng chuyển động cần nhất quán giữa các góc.
- Độ đẹp của hình tham chiếu chưa được đảm bảo chỉ bằng rig hoặc prompt. Cần đánh giá ảnh render, rồi đánh giá chuyển động và toàn bộ nhịp phim.

## Sai lệch trong flow trước

1. Mỗi cảnh bị ép đủ chuẩn bị–tiếp xúc–kết quả–phản ứng. Nhiều cảnh có cùng nhịp, thiếu cảnh chi tiết/phản ứng có chủ đích.
2. Storyboard đã duyệt bị một vòng AI diễn giải lại thành board khác trước khi tạo hình.
3. Bối cảnh sinh lại độc lập ở mỗi cảnh nên dễ đổi vị trí và tỷ lệ.
4. Kiểm tra mô tả/JSON trước render; trạng thái thành công không chứng minh hình ảnh đã đạt.
5. Cảnh mẫu dựng tay không chứng minh flow có thể tự dựng tốt từ lời đọc thật.

## Pipeline đã thay

Audio/kịch bản → transcript đầy đủ → Scene List 2–6 giây, nhóm theo tình huống → kiểm tra ý nghĩa thị giác → chỉ sửa cảnh yếu → người dùng chỉnh/duyệt → biên dịch nhịp đã duyệt → tạo lớp vector, tái dùng set → render khung hình theo thời gian/điểm tiếp xúc → gửi ảnh thực vào ChatGPT để kiểm tra → sửa các layer lỗi → ghép và xuất.

Mỗi cảnh có `story`: sequence, role, intent, evidence, before, after, focus, framing, cut_reason và 1–4 beats. Skill được gửi bằng nội dung, không bằng đường dẫn local.

Các cảnh được chấp nhận vẫn được cache. Set hình học tĩnh được dùng lại theo location; người và đạo cụ chuyển động nằm ngoài set. Camera có thể đổi cỡ cảnh khi có lý do kể chuyện. Các preset chuyển động/rig từ lượt sửa trước tiếp tục được dùng trong renderer; không coi preset là giải pháp cho mọi tạo hình.

## Kiểm tra và giới hạn

- Story review chỉ đánh giá ý tưởng; không tuyên bố đã xem pixels.
- Render review nhận PNG đính kèm gồm các khung đầu/cuối, khung giữa và trước/đúng/sau nhịp hành động. Không gửi đường dẫn file trong prompt.
- Review trả tất cả lỗi quan trọng theo layer/camera; bước sửa giữ các layer còn lại.
- `sampled_frames_passed` chỉ có nghĩa các khung lấy mẫu được chấp nhận. Không đồng nghĩa chuyển động mọi frame mượt, âm thanh tốt hoặc toàn bộ video đã ngang tham chiếu.
- ChatGPT web phải có phiên đăng nhập và ô upload ảnh hoạt động. Không thể xác nhận end-to-end với dịch vụ thật khi app đang báo chưa kết nối. Không bỏ cổng duyệt storyboard để vượt qua hạn chế đó.
- Bản thử local dùng fixture để xác minh kỹ thuật. Không đưa cảnh fixture ra làm bằng chứng chất lượng sáng tạo của pipeline.
