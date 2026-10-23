# Khuôn mẫu video giải thích 2D

## 1. Nguồn và phạm vi

Tài liệu này được rút ra từ `Desktop/sample/sample-video.mp4` (40,5 giây; 1920 × 1080; 24 fps) và các khung hình trong [bảng tham chiếu](bang-tham-chieu-phong-cach.jpg). File `audio.m4a` có cùng độ dài. Đây là **một mẫu**, vì vậy các con số bên dưới là khoảng thực hành để tái tạo cảm giác của mẫu, không phải thông số sản xuất gốc. Không có bản chép lời được xác minh; những nhận xét về quan hệ hình–lời dựa trên nội dung nhìn thấy trên màn hình.

Mục tiêu: tạo video giải thích kể một giả định hoặc ý tưởng trừu tượng bằng nhân vật que, cảnh đời thường, cận cảnh vật dụng và đồ họa số liệu. Giữ ngôn ngữ thị giác, nhịp kể và mức hoàn thiện; thay câu chuyện, vật dụng và số liệu theo kịch bản mới. Không sao chép máy móc chi tiết của ví dụ nếu chúng không phục vụ nội dung mới.

## 2. Dấu hiệu nhận diện bắt buộc

| Thành phần | Quy tắc tái tạo |
|---|---|
| Khung hình | 16:9, bố cục rõ ở kích thước điện thoại. Chủ thể chiếm khoảng 20–55% chiều rộng; cận cảnh vật dụng có thể chiếm 60–85%. |
| Hình vẽ | 2D vector hoặc giả vector, hình học đơn giản, nét sạch, mép mềm rất nhẹ; không dùng chất liệu ảnh thật. Bối cảnh có nhiều lớp phẳng và bóng đổ dịu để tạo chiều sâu vừa đủ. |
| Nhân vật | Đầu tròn gần đen, thân tay chân mảnh, bàn tay tối giản. Mắt và miệng trắng là nguồn biểu cảm chính. Một hoặc hai món đồ nhận diện như áo xanh, khăn kem, kính tròn. Giữ tỉ lệ và trang phục xuyên suốt các cảnh. |
| Màu | Hai hệ màu luân phiên: cảnh đời thường ấm, gỗ nâu–be, xanh xám dịu, áo xanh lam; cảnh dữ liệu nền xanh than gần đen, chữ/đường biểu đồ kem vàng. Vàng ấm dùng để nhấn số, trạng thái, vật quan trọng; không phủ đều mọi thứ. |
| Ánh sáng | Vignette và vùng sáng trung tâm nhẹ ở cảnh dữ liệu; ánh sáng phòng mềm ở cảnh nhân vật. Tương phản đủ cao để đọc hình ngay. |
| Chữ | Sans serif đậm, chữ hoa cho ý chính, rất ít chữ mỗi màn hình. Số hoặc từ khóa lớn hơn nhãn phụ rõ rệt. Chữ là một phần của đồ họa giải thích, không thành đoạn văn dài. |
| Không khí | Tò mò, dễ hiểu, có chút hài hước qua biểu cảm và tình huống. Cảm giác gọn và được dựng có chủ đích, không ồn ào. |

### Bảng màu định hướng

Lấy màu từ khung tham chiếu trước khi sản xuất; các mã sau là điểm khởi đầu gần đúng: nền dữ liệu `#101827`/`#172139`, đen nhân vật `#11101A`, kem sáng `#F3E9CF`, vàng nhấn `#F2C75F`, xanh áo `#2D63B7`, xanh tủ `#718F80`, nâu gỗ `#8A684D`. Chỉ điều chỉnh khi cần tăng tương phản.

## 3. Ngữ pháp kể chuyện bằng hình

Một ý thoại không cần một cảnh nhân vật nói trực diện. Mẫu liên tục đổi **chức năng hình ảnh**:

1. **Đặt tình huống:** cảnh rộng cho thấy người, nơi chốn và quan hệ giữa họ. Ví dụ: bếp có hai nhân vật, bàn, bồn rửa.
2. **Vật chứng cụ thể:** cận cảnh điện thoại, bảng mạch, tay cầm, thông báo. Dùng vật để làm khái niệm trở nên sờ thấy được.
3. **Giải thích trừu tượng:** chuyển sang nền tối và biểu đồ, đường cong, số lớn. Cho khán giả thấy quy mô, phân phối, sự khác biệt.
4. **Hệ quả trong đời sống:** trở lại nhân vật trong nhà hoặc bãi xe; hành động của họ minh họa điều số liệu vừa nêu.
5. **Phản ứng/cảm xúc:** cận mặt, thay mắt–miệng và tư thế để chốt sắc thái hài hước hoặc bất ngờ.

Luân phiên `đời thường → vật chứng → dữ liệu → đời thường`. Cùng một vật hoặc nhân vật có thể trở lại nhiều lần để giữ mạch truyện. Cảnh ở giây 0–20 và 20–40 trong mẫu lặp lại nhiều motif (điện thoại, đồ thị, bãi xe, bếp); coi đây là kỹ thuật nối ý và tạo nhận diện, không buộc phải lặp nguyên footage.

### Cách chọn hình cho từng câu kịch bản

| Loại câu | Hình nên dùng | Chuyển động chính |
|---|---|---|
| “Nếu…?” hoặc mệnh đề gây tò mò | Nền tối, số/từ khóa lớn, một chi tiết sáng nhỏ để dẫn mắt | Reveal chữ theo nhịp, scale nhẹ |
| Mô tả nhân vật/hành vi | Cảnh rộng hoặc trung, nhân vật trong môi trường có đạo cụ | Đi bộ, quay đầu, chạm/cầm vật |
| Giải thích cơ chế | Cận vật hoặc sơ đồ đơn giản | Camera tiến vào, đường tín hiệu chạy, điểm sáng bật |
| Nêu con số/so sánh | Biểu đồ nền tối, trục và nhãn tối giản | Đường vẽ dần, cột/điểm hiện theo thứ tự |
| Nêu kết quả | Cận màn hình hoặc phản ứng khuôn mặt | Thay trạng thái màn hình, mắt–miệng, cử chỉ tay |

Mỗi cảnh phải trả lời được: **người xem hiểu thêm điều gì chỉ bằng hình?** Nếu hình chỉ trang trí mà không tăng hiểu biết hoặc cảm xúc, thay cảnh khác.

## 4. Hệ chuyển động

### 4.1. Nhân vật

- **Đi bộ:** thân dịch đều theo đường ngang; chân luân phiên 2–4 tư thế, tay đánh đối xứng nhẹ, đầu nhấp rất ít. Tốc độ vừa để người xem vẫn nhận ra bối cảnh. Có 0,1–0,2 giây chuẩn bị/dừng trước khi đổi hành động.
- **Nói chuyện:** ưu tiên cử chỉ và nét mặt hơn lip sync chi tiết. Miệng đổi 2–3 hình (đóng, mở nhỏ, mở lớn) theo âm tiết/nhịp câu; chớp mắt và nghiêng đầu hiếm, có mục đích. Tay đang nói có thể mở ra, chỉ hoặc nâng lên ở từ khóa, rồi trở về tư thế nghỉ.
- **Nghe/phản ứng:** giữ thân gần như đứng yên; thay mắt, lông mày/miệng hoặc góc đầu. Cận mặt ngắn có sức nặng hơn một chuỗi vung tay liên tục.
- **Tương tác đồ vật:** cho thấy rõ chuỗi `nhìn → đưa tay → chạm/cầm → vật đổi trạng thái → phản ứng`. Tay và vật phải cùng điểm tiếp xúc qua các frame.
- **Tay chỉ/nhấn:** chuyển động theo cung ngắn, có overshoot rất nhẹ và dừng hẳn ở đối tượng. Dùng điểm sáng/đường tín hiệu trên vật để xác nhận tác động.

### 4.2. Máy quay và các lớp

- Cảnh rộng thường máy gần tĩnh; nhân vật di chuyển trong khung. Cảnh cận dùng pan hoặc push-in ngắn để chuyển sự chú ý từ tổng thể sang chi tiết.
- Dùng parallax nhẹ giữa tiền cảnh, nhân vật và hậu cảnh; không biến thành chuyển động 3D mạnh.
- Khi zoom vào vật, giữ điểm neo của vật ổn định và cho nền lùi nhẹ; dễ đọc hơn một cú zoom đồng thời mọi lớp.
- Mỗi shot chỉ nên có một chuyển động dẫn mắt chính. Các chuyển động phụ (hơi thở, chớp mắt, ánh sáng màn hình) phải nhỏ.

### 4.3. Đồ họa và giao diện

- Số lớn hiện sau một khoảng trống thị giác; có thể fade/scale rất nhẹ, rồi giữ đủ lâu để đọc.
- Đồ thị xây từng lớp: trục → đường/cột → vùng/điểm nhấn → nhãn số. Đường vẽ theo hướng lập luận. Khi chuyển từ số liệu sang ví dụ, cut vào cảnh có hình tương ứng.
- Màn hình điện thoại dùng thay trạng thái rõ ràng (pin, tín hiệu, cuộc gọi); tránh chữ nhỏ không đọc được. Có thể dùng glow ngắn cho trạng thái vừa đổi.
- Bảng mạch hoặc thiết bị: điểm sáng chạy trên tuyến đường, chạm linh kiện rồi phản hồi; không chạy lung tung như hiệu ứng trang trí.

### 4.4. Thời lượng tham chiếu

Mẫu cắt khá nhanh và xen shot rất ngắn với shot đọc thông tin lâu hơn. Bắt đầu dựng thử với: shot chuyển ý/cận chi tiết 0,5–1,5 giây; shot nhân vật/đọc số 1,5–3 giây; cận phản ứng 0,5–1 giây. Đây là khoảng gợi ý, phải căn lại theo độ dài lời thoại và thời gian đọc chữ. Chuyển động thường có ease in/out nhẹ; hạn chế lắc, nảy và overshoot mạnh.

## 5. Chuyển cảnh và nhịp dựng

**Hard cut là mặc định.** Cắt theo điểm kết thúc hành động, theo từ khóa trong lời kể, hoặc theo vật/đường nét tương ứng giữa hai shot. Có thể chuyển từ cận điện thoại sang một sơ đồ cùng dạng, hoặc từ đồ thị sang nhân vật đang chịu tác động của con số đó. Dùng dissolve/fade rất ngắn khi vào hoặc ra không gian dữ liệu tối; không dùng hiệu ứng chuyển cảnh phô trương liên tục.

Ở cuối mỗi cụm ý, tạo nhịp `thông tin → minh họa → phản ứng` rồi mới đưa khái niệm mới. Âm thanh có thể nhấn điểm xuất hiện số, chạm màn hình, tín hiệu hoặc cut quan trọng; âm thanh phải hỗ trợ hành động. Không suy ra một bộ hiệu ứng âm thanh cố định từ mẫu khi chưa nghe và phân tích riêng track âm thanh.

## 6. Bộ tư liệu và cấu trúc dự án để AI khác dùng lại

File [bảng tham chiếu](bang-tham-chieu-phong-cach.jpg) là overview. Thư mục [style_refs](style_refs/) chứa 12 frame gốc đã trích để kiểm tra từng thành phần. Khi sản xuất video mới, tạo thêm:

Thư mục [motion_refs](motion_refs/) chứa các đoạn **tham chiếu chuyển động** cắt từ video mẫu (không âm thanh). Xem `01_dien_thoai_va_tay.mp4` để quan sát cận vật và tay, `02_di_chuyen_bai_xe.mp4` cho dáng đi/bố cục ngang, `03_cu_chi_voi_dien_thoai.mp4` cho tương tác điện thoại, `04_do_thi_xuat_hien.mp4` cho nhịp dựng đồ họa, và `05_nhan_vat_bep_va_bieu_cam.mp4` cho tư thế cùng phản ứng mặt. Các clip này là **bằng chứng thị giác**, chưa phải rig/preset có thể kéo thả.

```text
project/
  brief.md                 # chủ đề, người xem, độ dài, thông điệp
  script.md                # lời thoại chia câu và ý chính của từng câu
  storyboard.csv           # timecode, lời, chức năng hình, bố cục, hành động, chuyển cảnh
  assets/
    characters/            # nhân vật tách đầu, mắt, miệng, thân, tay, chân
    backgrounds/           # bối cảnh theo nhiều lớp để parallax
    props/                 # điện thoại, bàn, xe, đồ vật theo kịch bản
    infographics/          # trục, nhãn, đường, cột, điểm nhấn tách lớp
  motion/                   # walk, talk, point, hold, react, UI-reveal, chart-build
  renders/                  # preview và bản xuất cuối
```

**Kho chuyển động nên là rig/preset có tham số**, không phải một video mẫu khóa cứng. Mỗi preset cần: tên, mục đích, tư thế đầu/cuối, các điểm neo, thời lượng mặc định, phạm vi điều chỉnh, easing và một preview. Tối thiểu có `idle`, `walk`, `turn-head`, `talk`, `point`, `reach-and-tap`, `hold-phone`, `react-surprised`, `react-skeptical`, `screen-state-change`, `chart-draw`, `text-reveal`, `camera-push`. Tạo các biến thể trái/phải, trước/sau khi cần. Có thể triển khai bằng After Effects/Blender/HTML Canvas hoặc công cụ tương đương; quy tắc thị giác và timing quan trọng hơn phần mềm.

Mẫu `storyboard.csv`:

```csv
start,end,voice_idea,visual_role,scene,shot,main_action,on_screen_text,transition
0.0,1.4,"Đặt giả định",hook,"data-dark","wide","số hiện, giữ để đọc","[SỐ/TỪ KHÓA]","cut"
1.4,3.5,"Giới thiệu nhân vật",context,"interior","wide","nhân vật bước vào và nhìn đạo cụ","","cut"
3.5,5.0,"Nêu cơ chế",evidence,"prop-closeup","close","tay chạm, màn hình đổi trạng thái","[NHÃN NGẮN]","cut"
```

## 7. Quy trình sản xuất bắt buộc

1. Chia script theo **ý cần hiểu**, không chia theo số giây đều nhau. Đánh dấu hook, cơ chế, số liệu, ví dụ, hệ quả, phản ứng.
2. Lập storyboard, gán một chức năng hình rõ ràng cho mỗi câu; tái dùng motif khi cùng một khái niệm quay lại.
3. Dựng animatic bằng hình tĩnh với voiceover. Chốt nhịp và thứ tự trước khi vẽ chuyển động chi tiết.
4. Thiết kế một bộ nhân vật và bối cảnh thống nhất; khóa màu, kích thước nét, tỉ lệ đầu/thân, font, độ tương phản.
5. Rig nhân vật và vật dụng theo lớp. Dựng chuyển động theo chuỗi nhân quả; tránh động tác vô cớ.
6. Làm các cảnh đồ họa ở một hệ riêng nền tối, rồi cắt qua cảnh đời thường đúng lúc ý trừu tượng cần minh họa.
7. Kiểm tra bản xem không tiếng: vẫn hiểu quan hệ hình và có thể nhận ra ý chính. Kiểm tra bản chỉ nghe: nhịp cắt không bỏ xa lời thoại.
8. Xuất ở đúng tỉ lệ/fps của dự án, kiểm tra đọc chữ trên màn hình nhỏ và tính nhất quán nhân vật qua toàn bộ video.

## 8. Prompt giao việc cho AI tạo video mới

> Hãy đọc toàn bộ `KHUON-MAU-VIDEO-GIAI-THICH-2D.md` và xem `bang-tham-chieu-phong-cach.jpg` cùng các ảnh trong `style_refs/`. Tạo một video giải thích 2D về **[CHỦ ĐỀ]**, dài **[THỜI LƯỢNG]**, theo kịch bản **[SCRIPT]**. Giữ nhân vật que đầu tròn tối, biểu cảm mắt–miệng trắng, bối cảnh phẳng ấm, cận cảnh vật dụng và đồ họa số liệu nền xanh than với nhấn vàng kem. Mỗi câu thoại phải có một hình minh họa có chức năng: đặt tình huống, chỉ vật chứng, giải thích cơ chế, biểu diễn số liệu, hoặc cho thấy hệ quả. Dựng nhịp nhanh nhưng cho chữ và số đủ thời gian đọc. Dùng hard cut chủ yếu, cử chỉ tay có điểm đích và phản ứng nhân vật có nguyên nhân. Trước khi render, tạo `storyboard.csv`, danh sách asset, danh sách preset chuyển động và animatic để kiểm tra. Nội dung, số liệu và vật dụng phải đúng với chủ đề mới; không tự bịa số liệu chưa được cung cấp.

## 9. Tiêu chí kiểm tra đầu ra

- [ ] Trong 3 giây đầu có chi tiết gây tò mò rõ ràng (vật, trạng thái, con số hoặc tình huống); câu hỏi lớn có thể xuất hiện sau khi đã có ngữ cảnh.
- [ ] Mỗi shot có một chủ thể dẫn mắt và một chức năng trong lập luận.
- [ ] Nhân vật giữ cùng thiết kế; ánh mắt, miệng, tay và vật cầm không bị lệch giữa frame.
- [ ] Chuyển động tay/chân có điểm bắt đầu, điểm kết thúc và phản hồi của vật khi chạm.
- [ ] Đồ thị và chữ dễ đọc, số liệu đúng kịch bản, không lạm dụng đoạn chữ dài.
- [ ] Cảnh đời thường và cảnh dữ liệu dùng đúng hai hệ màu; màu nhấn nhất quán.
- [ ] Cut bám lời kể hoặc hành động, không gây mất phương hướng.
- [ ] Video có nhịp biến đổi: rộng → cận → trừu tượng → đời thường → phản ứng.
- [ ] Xem ở kích thước điện thoại vẫn đọc được từ khóa và hiểu hành động.

## 10. Giới hạn của mẫu

Một video 40,5 giây chỉ đủ suy ra ngôn ngữ thị giác và một số kiểu chuyển động, không đủ để xác định chắc chắn toàn bộ quy chuẩn thương hiệu, font gốc, thông số rig, hiệu ứng âm thanh hay mức độ lip sync của cả một series. Khi có thêm 3–5 video, nên đối chiếu rồi cập nhật tài liệu, tách điều thật sự lặp lại khỏi lựa chọn riêng của tập này.
