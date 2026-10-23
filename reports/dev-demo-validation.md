Demo trên dev đã hoàn tất ngày 12/10/2026, tại `http://localhost:3000`. Đã chạy luồng tạo video thật từ giao diện với audio có sẵn, mật độ ảnh dày; sau đó sửa và tạo lại những ảnh không đạt, rồi xuất lại MP4. Không commit.

Kết quả: 8 cảnh, 37 ảnh Google AI Studio, 95,8 giây, 2.874 khung hình, 1920×1080 ở 30 fps. Thời lượng ảnh nằm trong 1,333–4,267 giây, dưới mức tối đa 4,375 giây. Không còn ảnh SVG thay thế. Đủ 411 từ của transcript audio; kịch bản tham khảo 447 từ chỉ làm ngữ cảnh.

Các lỗi đã tái hiện và sửa:

- AI giữ ảnh 6,233 giây dù đã được báo lỗi nhịp. Tách bước AI chọn ranh giới khỏi viết ý tưởng; căn theo audio, sửa mốc trước khi viết prompt. Không chia ảnh bằng kế hoạch cục bộ hoặc nới giới hạn nhịp.
- Gemini 3.8 trả lỗi nội bộ. Thử lại trong chat mới, rồi chuyển model dự phòng trong Studio khi cần; giữ kiểm tra JSON và review. Không dùng API cho lập kế hoạch.
- Bộ chọn model bấm vào nút Images nằm sau hộp thoại, gây timeout 60 giây. Giới hạn thao tác vào hộp thoại và mở chat bằng model ID.
- Tạo ảnh timeout hoặc lỗi dịch vụ nhưng pipeline thay bằng SVG và báo thành công. Bổ sung retry có giới hạn, đọc ảnh từ phản hồi mới trên trang, hủy lượt lỗi trước khi trả tab. Nếu vẫn thiếu ảnh, báo lỗi và giữ dự án cũ.
- Ảnh trước trong cùng chat ảnh hưởng sai bố cục ảnh sau. Mỗi ảnh hiện bắt đầu từ chat mới; đã tạo lại hai ảnh để kiểm chứng trực tiếp.
- Kiểm tra hình thực tế phát hiện biển hiệu có chữ, khách đứng chờ và cúp chiến thắng không có trong lời đọc. AI sửa ý tưởng, review lại và sinh lại ảnh. Bổ sung kiểm tra hàng chờ và cúp; phân biệt mô tả khẳng định với điều cấm.
- Thông báo lỗi lưu/xuất bị ẩn trong App. Khôi phục nội dung thông báo và kiểm tra lỗi lưu, hoàn tác, xuất lại.
- Tiến độ bị lùi giữa các cảnh. Sửa cách tính theo từng cảnh và có test bảo đảm tiến độ không giảm.

Bằng chứng kiểm tra:

- PASS: 50 test Node/TypeScript, gồm pipeline với audio, bảo toàn khung hình, retry, model picker, JSON, review và ảnh lỗi không ghi đè dự án.
- PASS: 5 test Python về căn audio.
- PASS: `studio-ui`, `studio-editor`, `studio-ux`, `studio-timeline`, `image-density-ui`. Các thao tác ghi trong các test này được mock; kiểm tra bàn phím, kéo/chạm timeline, thêm/xóa/hoàn tác, lỗi lưu/render và kích thước màn hình 320–1920 px.
- PASS: `preview-playback` chạy trên dự án thật, kiểm tra đồng hồ phát, đồng bộ audio/ảnh, tạm dừng, chọn cảnh và phát tiếp.
- PASS: nhấn tải MP4 trên giao diện thật; SHA-256 file tải khớp file render, không có lỗi JavaScript trình duyệt.
- PASS: FFprobe xác nhận H.264 1920×1080, 30 fps, 2.874 frame; FFmpeg giải mã toàn bộ file không lỗi. Track AAC dài 95,821 giây do đệm mã hóa, video dài đúng 95,8 giây.
- PASS: TypeScript, production build và `git diff --check`. Build còn cảnh báo kích thước bundle vượt 500 kB, không có lỗi build.
- PASS cho phần UI sửa đổi: trạng thái lỗi hiển thị rõ, test bàn phím và màn hình nhỏ đạt; giữ bố cục studio và màu nhấn amber hiện có.

[Số liệu kiểm tra](dev-demo-validation.json), [toàn bộ ảnh cuối](dev-demo-contact.png), [giao diện demo cuối](dev-demo-ui.png). Video nằm tại `public/final-video.mp4`; dự án hiện tại nằm trong `public/scenes.json` và `src/data/scenes.json`. Bản sao trước khi chạy nằm trong `/tmp/wevic-dev-demo/`.

Review tự động kiểm tra kế hoạch và prompt; kiểm tra pixel trong lượt demo này được thực hiện riêng bằng cách xem toàn bộ ảnh. Lỗi nội bộ và hạn mức Google AI Studio đã xuất hiện trong lượt chạy; ứng dụng có phục hồi có giới hạn và báo lỗi rõ khi không phục hồi được.
