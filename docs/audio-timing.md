# Căn ảnh theo lời đọc

Cài dependency trên máy chạy Vite/API:

```sh
python3 -m pip install -r scripts/requirements-audio.txt
```

Có thể đặt `WEVIC_PYTHON` thành đường dẫn Python trong virtualenv. `WEVIC_WHISPER_MODEL` mặc định là `small`; lần đầu faster-whisper tải model về cache Hugging Face. Audio được xử lý cục bộ. Timestamp được lưu trong thư mục tạm `wevic-word-timing`, khóa theo nội dung audio và model, để không nhận diện lại khi thay mật độ ảnh.

Audio nhập được nhận diện trước khi cắt thành cảnh. Mốc cảnh lấy từ lời nói tương ứng trong audio; mốc đặt thủ công vẫn được ưu tiên. Với TTS, từng file giọng đọc được nhận diện sau khi tạo. Sau khi chia nội dung thành các ảnh, mốc từng ảnh được căn với timestamp từ trong audio. Các mốc được làm tròn theo frame; tổng thời lượng giữ nguyên.

Mật độ Thưa/Vừa/Dày đặt nhịp mục tiêu 6/4/2,5 giây mỗi ảnh. Không giới hạn ba ảnh mỗi cảnh. Ưu tiên chia theo câu, rồi mệnh đề; câu quá dài được chia thành nhóm từ. Không ép ảnh đổi theo một chu kỳ cố định bất chấp lời đọc.

Nhận diện lời nói không phải căn chỉnh chính xác tuyệt đối: tiếng ồn, nhạc lớn, tên riêng, ngôn ngữ hoặc phát âm khó có thể làm giảm chất lượng. Khi tỷ lệ khớp quá thấp hoặc mốc không tăng dần, quá trình báo lỗi thay vì quay về chia theo số từ. Kịch bản cần khớp với audio. Các video đã tạo không bị thay đổi tự động.

Kiểm tra:

```sh
python3 scripts/audioAlignment.test.py
node --test scripts/audioAlignment.test.cjs scripts/projectEditor.test.cjs
```
