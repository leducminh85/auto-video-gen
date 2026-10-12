# Wevic Studio

Ứng dụng web tạo và chỉnh sửa video minh họa từ kịch bản hoặc file audio. AI lên kế hoạch phân cảnh và hình ảnh; người dùng xem trước, chỉnh timeline và xuất MP4 trong từng project.

README này mô tả các chức năng và cấu hình có trong mã nguồn. Ứng dụng hiện chạy theo mô hình local: giao diện React, API trong Vite dev server, dữ liệu và media lưu trên ổ đĩa.

## Nội dung

- [Chức năng](#chức-năng)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình AI](#cấu-hình-ai)
- [Sử dụng](#sử-dụng)
- [Luồng xử lý](#luồng-xử-lý)
- [Dữ liệu và API](#dữ-liệu-và-api)
- [Cấu trúc mã nguồn](#cấu-trúc-mã-nguồn)
- [Kiểm tra và build](#kiểm-tra-và-build)
- [Giới hạn và xử lý lỗi](#giới-hạn-và-xử-lý-lỗi)

## Chức năng

| Trang | Chức năng |
| --- | --- |
| `/` | Danh sách project với thumbnail, tìm kiếm, sắp xếp, đổi tên và xóa có xác nhận. |
| `/project/new` | Tạo video từ lời thoại hoặc audio; chọn giọng đọc, tốc độ, mật độ ảnh và phong cách hình ảnh. |
| `/project/:id` | Xem trước video, chọn cảnh, sửa timeline, thêm/xóa/tạo lại ảnh, hoàn tác và xuất MP4. |

Trong editor, có thể kéo ảnh để đổi thứ tự và kéo mép để điều chỉnh thời gian. Timeline có waveform audio, thanh zoom và thao tác bàn phím. Các thay đổi được lưu theo project; MP4 được render lại khi xuất nếu timeline đã thay đổi.

Form tạo video lưu bản nháp trong trình duyệt. Media và project được lưu ở server local, không nằm trong bản nháp trình duyệt.

## Yêu cầu môi trường

- **Node.js:** `^20.19.0` hoặc `>=22.12.0`, theo yêu cầu của Vite 8 được dùng trong dự án.
- **npm:** cài dependencies từ `package-lock.json`.
- **FFmpeg và FFprobe:** xử lý audio, đo thời lượng và xuất video.
- **Python 3 và faster-whisper:** nhận dạng lời thoại và lấy mốc thời gian theo từ trong pipeline audio.
- **Lệnh `edge-tts`:** được pipeline gọi khi tạo giọng đọc AI.
- **Chromium của Playwright:** mở Google AI Studio và chạy browser test.
- **Tài khoản truy cập Google AI Studio:** đăng nhập trong cửa sổ trình duyệt do ứng dụng mở.

**Lưu ý hệ điều hành:** một số lệnh trong [videoGenerator.cjs](scripts/videoGenerator.cjs) sử dụng trực tiếp `/opt/homebrew/bin/ffmpeg` và `/opt/homebrew/bin/ffprobe`. Vì vậy, không nên coi pipeline hiện tại là đã hỗ trợ đầy đủ mọi hệ điều hành chỉ bằng việc cài Node.js. [projectEditor.cjs](scripts/projectEditor.cjs) có cơ chế tìm binary trong PATH khi không có đường dẫn Homebrew, nhưng phần pipeline còn lại chưa đồng nhất theo cách này.

## Cài đặt và chạy

### 1. Lấy mã nguồn

```sh
git clone https://github.com/leducminh85/auto-video-gen.git
cd auto-video-gen
npm ci
npx playwright install chromium
```

### 2. Chuẩn bị công cụ audio

Cài FFmpeg/FFprobe và kiểm tra các lệnh có thể chạy:

```sh
ffmpeg -version
ffprobe -version
```

Có thể dùng môi trường Python riêng:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements-audio.txt
python -m pip install edge-tts
export WEVIC_PYTHON="$PWD/.venv/bin/python"
edge-tts --help
```

Các lệnh kích hoạt môi trường ở trên dành cho shell kiểu POSIX. Chạy dev trong cùng terminal đã kích hoạt môi trường để tiến trình Node tìm được `edge-tts`.

### 3. Chạy ứng dụng

```sh
npm run dev
```

Mở **http://localhost:3000**. Lệnh dev trong repository bind tới `0.0.0.0`, không chỉ riêng loopback.

### 4. Đăng nhập Google AI Studio

Khi dev server đang chạy, có thể yêu cầu ứng dụng mở cửa sổ đăng nhập qua API có sẵn:

```sh
curl -X POST http://localhost:3000/api/image-provider/test-connection
```

Đăng nhập trong Chromium do Playwright mở. Session được lưu tại `data/google-ai-studio-profile/`; trình duyệt chạy có giao diện (`headless: false`). Không cần nhập API key cho luồng lập kế hoạch bằng AI Studio web.

Kiểm tra trạng thái provider:

```sh
curl http://localhost:3000/api/image-provider/status
```

Không đưa profile đăng nhập hoặc `.env` lên Git. Các đường dẫn này đã được khai báo trong `.gitignore`.

## Cấu hình AI

### Lập kế hoạch qua Google AI Studio

[aiPlanningClient.cjs](scripts/aiPlanningClient.cjs) dùng giao diện web AI Studio qua Playwright. Các giá trị dưới đây là **mặc định trong code**, không phải cam kết rằng model tồn tại hoặc khả dụng trong mọi tài khoản:

| Biến môi trường | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `AI_STUDIO_PLANNING_MODEL` | `gemini-3.8-flash` | Model lập kế hoạch chính. |
| `AI_STUDIO_PLANNING_FALLBACK_MODEL` | `gemini-3.5-flash-lite` | Model dự phòng; chuỗi rỗng tắt fallback này. |
| `AI_STUDIO_PLANNING_TIMEOUT_MS` | `180000` | Thời gian chờ một yêu cầu lập kế hoạch, tính bằng mili giây. |
| `WEVIC_PYTHON` | `python3` | Python dùng để chạy nhận dạng và căn audio. |
| `WEVIC_WHISPER_MODEL` | `small` | Model faster-whisper; implementation hiện dùng CPU và `int8`. |

Ví dụ truyền cấu hình khi khởi động:

```sh
AI_STUDIO_PLANNING_TIMEOUT_MS=240000 npm run dev
```

Model được kiểm tra trong giao diện trước khi gửi yêu cầu. Lỗi nội bộ lặp lại, quota hoặc timeout có thể kích hoạt model dự phòng. Lỗi đăng nhập, chọn model hoặc response không hợp lệ không được coi là lý do để tự chuyển sang API hay dựng kế hoạch local.

### Tạo ảnh và model dự phòng

Danh sách trong [modelFallback.cjs](scripts/image-generation/modelFallback.cjs):

| Thứ tự | Tên trong cấu hình | Model ID |
| --- | --- | --- |
| 1 | Nano Banana | `gemini-2.5-flash-image` |
| 2 | Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` |
| 3 | Nano Banana 2 | `gemini-3.1-flash-image` |
| 4 | Nano Banana 2.1 | `gemini-nano-banana-2.1` |

Đây là chuỗi xử lý fallback cho model ảnh, không phải danh sách được xác nhận từ Google. Lỗi tạm thời có cơ chế thử lại/chuyển model; lỗi quota chuyển sang provider Flux local. Flux là fallback **tạo ảnh**, không thay thế bước lập kế hoạch phân cảnh.

### Flux local

[fluxEngine.cjs](scripts/image-generation/fluxEngine.cjs) thử local server trước, sau đó thử CLI `mflux-generate`:

| Cấu hình | Giá trị mặc định |
| --- | --- |
| `LOCAL_SD_PORT` | `7860` |
| `LOCAL_SD_API_URL` | `http://127.0.0.1:7860/sdapi/v1/txt2img` |
| Model trong lệnh mflux | `dhairyashil/FLUX.1-schnell-mflux-4bit` |
| Tham số mflux | Base `schnell`, 4 steps, 1024 × 576 |

Local server cần cung cấp endpoint tương thích `/sdapi/v1/txt2img` và trả ảnh base64 trong `images`. Code không tự cài server hoặc chọn model Flux cho server; cần chuẩn bị ở công cụ local của bạn. Kiểm tra kết nối còn dùng `LOCAL_SD_PORT`, vì vậy khi đổi endpoint cần cấu hình cổng tương ứng.

Nhánh mflux dùng MLX/Metal cho môi trường Apple Silicon. Cần có sẵn lệnh `mflux-generate` và model phù hợp; `npm ci` không cài các thành phần này. Nếu cả AI Studio và local provider thất bại, ứng dụng báo lỗi thay vì xuất ảnh SVG giả làm kết quả AI.

### API key và file môi trường

Repository có `.env.example`, nhưng một số chú thích trong file vẫn là nội dung cũ, gồm mô tả fallback SVG. Không dùng các chú thích đó để suy ra hành vi pipeline hiện tại.

Code còn có các nhánh sử dụng `GEMINI_API_KEY` và `OPENAI_API_KEY`, trong đó OpenAI key phục vụ nhánh DALL-E 3. Hai khóa này không phải điều kiện đăng nhập cho luồng AI Studio web được mô tả ở trên. Không điền các chuỗi placeholder trong `.env.example` như thể đó là khóa thật.

## Sử dụng

1. Mở dashboard và chọn **Tạo video mới**.
2. Nhập tiêu đề và chọn nguồn âm thanh:
   - **Giọng đọc AI:** nhập lời thoại, chọn giọng và tốc độ.
   - **Audio có sẵn:** tải file ghi âm; kịch bản nhập thêm chỉ làm tài liệu tham khảo về nội dung.
3. Chọn mật độ ảnh và phong cách hình ảnh. Các mức khoảng 6, 4 hoặc 2,5 giây/ảnh là định hướng nhịp, không phải giới hạn cứng bắt buộc mọi ảnh phải khớp.
4. Bấm tạo video và theo dõi tiến độ. Khi thành công, ứng dụng mở editor của project mới.
5. Trong editor, chọn cảnh rồi chỉnh ảnh và timeline. Khi thêm ảnh, viết mô tả, tạo ảnh xem trước rồi xác nhận thêm vào cảnh. Thêm ảnh chia thời gian của ảnh được chọn; không tự kéo dài audio.
6. Dùng nút xuất/tải MP4 ở header. Nếu đã sửa timeline, cần render lại để MP4 phản ánh các thay đổi.

Nút **Hoàn tác** giữ một trạng thái chỉnh sửa trước đó trong phiên editor, không phải lịch sử phiên bản project lâu dài.

## Luồng xử lý

```text
Kịch bản → tạo giọng đọc ─┐
                        ├→ lời thoại và mốc audio → AI chia cảnh
Audio có sẵn → nhận dạng ┘                         ↓
                                   AI lên kế hoạch ảnh và prompt
                                                  ↓
                                   kiểm tra cấu trúc + AI review
                                                  ↓
                                   tạo ảnh → ghép video → project
```

- Với audio nhập vào, transcript và mốc thời gian của audio là nguồn chính. Kịch bản tham khảo được truyền riêng, không dùng để ép audio khớp từng câu trong văn bản.
- Planner nhận toàn bộ lời thoại, bố cục cảnh, phong cách, thông tin liên tục giữa các cảnh và kế hoạch đã được chấp nhận trước đó.
- AI chọn ranh giới theo từ được đánh số. Server kiểm tra thứ tự và dựng lại lời thoại từ nguồn, tránh bỏ sót nội dung do chỉ số ranh giới.
- Kế hoạch được kiểm tra cấu trúc và review về nội dung, ý tưởng lặp, sự phù hợp với lời thoại. Phản hồi lỗi được dùng cho những lần sửa có giới hạn.
- Nhịp ảnh được căn theo audio; ảnh có thể giữ lâu hơn hoặc ngắn hơn mức gợi ý. Không cắt lời thoại chỉ để đạt nhịp ảnh.
- Metadata lưu thông tin lập kế hoạch tại `metadata.ai_planning` và chất lượng kế hoạch ở `planning_quality` của cảnh.

Review kế hoạch không phải kiểm định pixel của ảnh đã tạo. Người dùng vẫn cần xem ảnh, nghe audio và kiểm tra MP4 cuối cùng.

## Dữ liệu và API

| Đường dẫn | Nội dung |
| --- | --- |
| `public/projects/<id>/scenes.json` | Dữ liệu project, metadata, cảnh và ảnh trong timeline. |
| `public/projects/<id>/final-video.mp4` | MP4 xuất riêng của project. |
| `public/images/` | Ảnh dùng trong video. |
| `public/audio/` | Audio nguồn và audio đã xử lý. |
| `public/scenes.json`, `src/data/scenes.json` | Dữ liệu video dùng bởi pipeline/fixture hiện có; không thay thế kho project riêng. |
| `data/google-ai-studio-profile/` | Profile Chromium giữ session AI Studio. |

Project cũ được migrate một lần sang kho project. Xóa project xóa JSON và MP4 của project đó; ảnh/audio dùng chung được giữ lại. Khi sao lưu, cần giữ cả JSON và các media được tham chiếu, không chỉ file project.

API chính được đăng ký trong [vite.config.ts](vite.config.ts):

| Phương thức | Endpoint | Công dụng |
| --- | --- | --- |
| GET | `/api/projects` | Danh sách project. |
| GET | `/api/projects/:id` | Đọc project. |
| POST | `/api/projects/:id` | Lưu dữ liệu editor. |
| PATCH | `/api/projects/:id` | Đổi tên với body `{ "title": "Tên mới" }`. |
| DELETE | `/api/projects/:id` | Xóa project. |
| POST | `/api/projects/:id/render` | Lưu và render MP4. |
| GET / HEAD | `/projects/:id/final-video.mp4` | Đọc MP4, hỗ trợ byte range. |
| POST | `/api/generate-video` | Chạy pipeline tạo video. |
| POST | `/api/regenerate-beat` | Tạo lại ảnh. |
| POST | `/api/audio/import` | Nhập audio. |
| GET | `/api/image-provider/status` | Trạng thái provider. |
| POST | `/api/image-provider/test-connection` | Mở trình duyệt đăng nhập AI Studio. |

## Cấu trúc mã nguồn

```text
src/
  ProjectPages.tsx             Dashboard và điều hướng project
  App.tsx                      Editor video
  components/                  Form tạo video, timeline, dialog, header
  config/imageStyle.json       Phong cách ảnh mặc định
  utils/                       Chỉnh beat, quản lý dialog và tiện ích
  studio-design.css            Giao diện studio
scripts/
  videoGenerator.cjs           Pipeline tạo video
  aiPlanningClient.cjs         Client lập kế hoạch qua AI Studio
  aiProductionPlanner.cjs      Chia cảnh, kế hoạch ảnh và review
  image-generation/           Provider ảnh, trình duyệt và fallback
  alignAudio.py                Nhận dạng audio và timestamp theo từ
  projectStore.cjs             Lưu trữ project
  projectEditor.cjs            Xử lý audio, lưu và render
  *.test.cjs                   Test Node và Playwright
vite.config.ts                 Vite và API local
```

Giao diện dùng React, TypeScript, Vite và Lucide. Remotion Player dùng cho preview; các thao tác xuất trong project editor sử dụng FFmpeg. Font Be Vietnam Pro được phục vụ từ dependency local.

## Kiểm tra và build

```sh
npm run lint
npm run build
```

`lint` hiện chạy `tsc --noEmit` để kiểm tra kiểu; không phải ESLint. `build` tạo frontend trong `dist/`.

Các test có thể gọi trực tiếp:

```sh
node --test scripts/aiPlanningClient.test.cjs scripts/aiProductionPlanner.test.cjs scripts/audioAlignment.test.cjs
node --test scripts/projectStore.test.cjs scripts/projectEditor.test.cjs
node --test scripts/image-generation/modelFallback.test.cjs scripts/image-generation/fluxFallback.test.cjs
```

Một số test render cần FFmpeg. Test browser cần dev server chạy ở port 3000 và Chromium của Playwright; ví dụ:

```sh
node scripts/studio-timeline.test.cjs
node scripts/studio-editor.test.cjs
node scripts/project-pages.test.cjs
```

Các script browser có cách dùng fixture khác nhau: một số mock API, một số tạo/xóa project thử nghiệm và render thật. Đọc script trước khi chạy trên dữ liệu đang làm việc. Selector trong test cần được cập nhật khi UI đổi; việc liệt kê lệnh ở đây không khẳng định toàn bộ bộ test đang vượt qua.

Để xem kế hoạch AI thật mà không tạo ảnh:

```sh
node scripts/previewAIPlan.cjs public/scenes.json /tmp/ai-plan-review.json
```

Lệnh này dùng session AI Studio và phát sinh yêu cầu AI. Đóng trình duyệt Studio của ứng dụng trước khi chạy tiến trình standalone để tránh cùng mở một profile. Preview ước lượng timing; production căn theo audio thực tế. Kết quả hoàn thành có `complete: true`; file từ lượt bị ngắt có thể chỉ chứa một phần kế hoạch.

## Giới hạn và xử lý lỗi

| Hiện tượng | Điểm cần kiểm tra |
| --- | --- |
| Không mở được Chromium | Đã chạy `npx playwright install chromium`; môi trường có giao diện đồ họa; profile không bị tiến trình khác giữ. |
| AI Studio yêu cầu đăng nhập | Mở endpoint đăng nhập và hoàn tất trong đúng profile Playwright. |
| Không chọn được model | Model ID trong cấu hình phải khớp với model tài khoản thực sự có quyền dùng. |
| Hết quota tạo ảnh | Kiểm tra local server hoặc `mflux-generate`; fallback local cần được cài và sẵn sàng từ trước. |
| Thiếu module nhận dạng audio | Cài `scripts/requirements-audio.txt` bằng đúng Python được chỉ định ở `WEVIC_PYTHON`. |
| Không tìm thấy FFmpeg/FFprobe | Kiểm tra PATH và các đường dẫn `/opt/homebrew/bin/` còn dùng trong pipeline. |
| Mở project nhưng thiếu ảnh/audio | Git không chứa media sinh ra; khôi phục media tương ứng từ bản sao lưu hoặc tạo project mới. |
| MP4 chưa phản ánh chỉnh sửa | Xuất lại từ project editor sau khi đổi timeline. |

**Triển khai:** API hiện nằm trong hook `configureServer` của Vite. `npm run preview` chỉ xem frontend build, không thay thế backend dev và không cung cấp đầy đủ pipeline video. Đưa riêng `dist/` lên static hosting chưa đủ để vận hành ứng dụng; cần tách hoặc triển khai backend cùng các công cụ, storage và môi trường trình duyệt tương ứng.

Repository hiện không triển khai hệ thống tài khoản người dùng và phân quyền cho các API local kể trên. Không coi dev server là dịch vụ public đã sẵn sàng cho nhiều người dùng.
