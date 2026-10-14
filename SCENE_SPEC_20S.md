# 500 IQ ANIMATION: 20-SECOND REMOTION MASTER SPECIFICATION

## 1. PROJECT METRICS & ENVIRONMENT
- **Framework:** Remotion (React 18+, TypeScript)
- **Canvas Resolution:** 1920 x 1080 (16:9 Full HD)
- **Frame Rate:** 60 FPS (Đảm bảo chuyển động mượt mà chuẩn cinematic)
- **Duration:** 20.0 seconds = 1200 frames
- **Styling Architecture:** Inline SVG + CSS Modules / TailwindCSS

---

## 2. GLOBAL DESIGN SYSTEM & PALETTE

### Color Tokens
- **Backgrounds:**
  - Wood Desk: `#6D4C41` with `#5D4037` grain lines
  - Circuit Green: `#0F5132` (PCB substrate), `#FFD700` (Gold traces)
  - Elevator Metallic: `#4A5568` to `#2D3748` linear gradient
  - Underground Garage: `#1F2937` with road striping `#E5E7EB`
  - Kitchen Warmth: `#F3E8DC` (Walls), `#111827` (Night window)
- **Characters:**
  - Stickman Skin: Jet Black `#111827`
  - Leo's Hoodie: Royal Electric Blue `#2563EB`
  - Accent / Tech Glowing Green: `#22C55E` (Battery, LEDs, Full Signal)
  - Negative / Error Red: `#EF4444` (No Signal, Scammer accents)
- **Effects & Lighting:**
  - Screen Glow: `filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.6))`
  - Warm Morning Light: Radial gradient overlay `#FDE047` at 12% opacity

---

## 3. SCENE BREAKDOWN & TIMELINE SPECIFICATION

### Scene 1: The Kitchen Desk & Rebuilt Phone (0.0s – 4.5s | Frames 0 – 270)
*Góc máy: Top-down nhìn thẳng xuống bàn ăn sáng.*
- **Asset Layers:**
  - `TableSurface`: Mặt bàn vân gỗ có ánh nắng rọi chéo góc trên bên phải.
  - `Plate`: Đĩa sứ trắng với 1 lát bánh mì nướng (toast).
  - `Mug`: Ly cà phê đen bốc hơi nước (sử dụng hạt particle bay theo hàm sin).
  - `BlackGloves`: Bàn tay người que mang găng tay đen cầm kẹp gắp linh kiện.
  - `PhoneDevice`: Điện thoại viền mỏng đen bóng ở giữa màn hình.
- **Animation Choreography:**
  - **F0 - F60:** Camera lia nhẹ (pan-down từ y: -30px về 0px, Easing.outCubic).
  - **F40 - F120:** Màn hình điện thoại bật sáng (`opacity` từ 0 -> 1 kèm hiệu ứng nở sáng). 
  - **F60 - F180:** Biểu tượng tia sét sạc pin hiện lên. Thanh pin màu xanh neon `#22C55E` nạp đầy từ 0% lên 100%. Dòng chữ `BATTERY` hiện ra, tiếp theo là số `31 DAYS` phóng to nhẹ bằng `spring({ damping: 10 })`.
  - **F180 - F270:** Bàn tay mang găng nhấc điện thoại lên, camera zoom nhẹ vào màn hình (scale 1.0 -> 1.2).

---

### Scene 2: Extreme Macro - Microchip & Antenna (4.5s – 7.5s | Frames 270 – 450)
*Góc máy: Cận cảnh vi mạch (Extreme Close-up PCB).*
- **Asset Layers:**
  - `PCBBackground`: Bo mạch xanh lục đậm `#0F5132` với các đường dẫn vi mạch màu vàng gold óng ánh.
  - `Microchip`: Chip silicon màu đen vuông vức có chân kim loại.
  - `Tweezers`: Kẹp gắp kim loại màu bạc điều khiển việc hạ chip.
  - `AntennaWire`: Sợi dây đồng nhỏ uốn cong góc 90 độ.
- **Animation Choreography:**
  - **F270 - F330:** Đầu kẹp kim loại hạ con chip đen xuống đúng ô tiếp xúc trên bo mạch (y di chuyển từ -200px xuống 0px với `spring({ stiffness: 120, damping: 14 })`).
  - **F330 - F390:** Một que trâm kim loại ấn vào sợi dây đồng mảnh, uốn nó gập một góc vuông chính xác tiếp xúc vào chân chip.
  - **F390 - F450:** Khớp nối tiếp xúc lóe lên một tia lửa nhỏ, đèn LED bán dẫn màu xanh ngọc bên cạnh phát sáng rực rỡ (`filter: drop-shadow(0 0 20px #22C55E)`).

---

### Scene 3: The Elevator Contrast (7.5s – 11.5s | Frames 450 – 690)
*Góc máy: Ngang mắt trong thang máy kín.*
- **Asset Layers:**
  - `ElevatorInterior`: Vách thang máy kim loại xám kim, bảng nút bấm có đèn led đỏ mũi tên đi xuống.
  - `Silhouettes`: 2 bóng người que phụ đứng sau, cúi đầu nhìn điện thoại thất vọng.
  - `HeroLeo`: Leo đứng chính giữa mặc áo hoodie xanh dương `#2563EB`.
  - `PhoneScreenComparison`: Split visual 2 màn hình điện thoại.
- **Animation Choreography:**
  - **F450 - F510:** Cửa thang máy đóng lại từ hai bên. Đèn báo tầng nhảy số đi xuống.
  - **F510 - F600:**
    - Điện thoại người đứng cạnh hiện lên icon máy bay đỏ chéo kèm dòng chữ nhấp nháy `NO SIGNAL`.
    - Leo giơ máy lên: Màn hình điện thoại của Leo phóng lớn vào góc nhìn người xem. 5 cột sóng màu xanh lá cây (`#22C55E`) nhảy vút lên kịch trần kèm chữ `FULL SIGNAL`.
  - **F600 - F690:** Leo nhếch mép cười nhẹ (đôi mắt cong bán nguyệt dạng vector).

---

### Scene 4: Basement -3 Underground Parking (11.5s – 15.5s | Frames 690 – 930)
*Góc máy: Toàn cảnh hầm gửi xe tầng B3.*
- **Asset Layers:**
  - `GarageEnvironment`: Cột bê tông vàng đen có chữ `LEVEL -3`, trần nhà có hàng đèn tuýp huỳnh quang chiếu sáng điểm.
  - `FrustratedCrowd`: 3 nhân vật que giơ hai tay cầm điện thoại lên trời tìm sóng trong vô vọng.
  - `LeoWalking`: Leo tự tin bước đi lướt qua khung hình (Walk cycle vector 2D).
  - `VideoCallBubble`: Khung hình tròn FaceTime nổi trên điện thoại với hình ảnh cô em gái hoạt họa đang nói chuyện mượt mà không hề giật lag.
- **Animation Choreography:**
  - **F690 - F850:** Chuyển động bước chân (walk cycle) của Leo từ trái sang phải màn hình với chu kỳ chân gập-duỗi bằng hàm sin/cos.
  - **F750 - F930:** Bong bóng video call phóng to, hiển thị avatar cô em gái với dải tín hiệu xanh lá 5 vạch ổn định tuyệt đối. Các nhân vật phụ ngoái đầu nhìn theo kinh ngạc.

---

### Scene 5: Warm Tea & IQ 500 Title Reveal (15.5s – 20.0s | Frames 930 – 1200)
*Góc máy: Trở lại gian bếp ấm áp chuyển dịch sang không gian tối trừu tượng.*
- **Asset Layers:**
  - `KitchenWindow`: Khung cửa sổ nhìn ra thành phố ban ngày.
  - `LeoSitting`: Leo cầm cốc trà bốc khói đưa lên miệng uống. Cốc hiển thị thông số `60.0°C`.
  - `VignetteDarkness`: Màn đêm mờ dần bao phủ không gian xung quanh.
  - `TitleTypography`: Dòng chữ phát sáng `WHAT IF YOU HAD 500 IQ?`.
  - `BellCurveGraph`: Đồ thị phân phối chuẩn Gauss (chuông Gaussian) vẽ bằng đường viền vector chạy mượt từ trái sang phải.
- **Animation Choreography:**
  - **F930 - F1020:** Leo nâng cốc trà lên miệng, nhấp một ngụm, mắt nhắm lại hài lòng. Khói nghi ngút vẫn bốc lên giữ nguyên độ nóng.
  - **F1020 - F1080:** Không gian phòng mờ dần vào nền tối gradient đen tím (`#0B0F19`).
  - **F1080 - F1200:**
    - Dòng chữ `WHAT IF YOU HAD 500 IQ?` bật sáng ở giữa màn hình (Scale từ 0.8 lên 1.0 với `spring`, chữ màu cam sáng viền vàng).
    - Phía dưới, đường cong hình chuông màu vàng neon tự động vẽ ra (`strokeDashoffset` từ 1000 về 0). Cột mốc điểm 100 ở đỉnh chuông nhấp nháy, sau đó một điểm sáng chạy tít ra ngoài mép cực hiếm hiển thị số `500`.

---

## 4. MATHEMATICAL ANIMATION UTILITIES FOR CODEX

Codex cần triển khai các hàm tiện ích chuyển động sau để tránh code giật:

```typescript
import { interpolate, spring, Easing } from 'remotion';

// 1. Smooth Entry Scale
export const popIn = (frame: number, fps: number, delay: number = 0) =>
  spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 140 },
  });

// 2. Cinematic Smooth Easing for Cameras
export const smoothCamera = (frame: number, start: number, end: number, from: number, to: number) =>
  interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  });

// 3. Procedural Steam Particles
export const getSteamPath = (frame: number, index: number) => {
  const progress = ((frame * 1.5 + index * 40) % 100) / 100;
  const y = -progress * 60;
  const x = Math.sin(progress * Math.PI * 3 + index) * 8;
  const opacity = Math.sin(progress * Math.PI);
  return { x, y, opacity, scale: 0.5 + progress * 0.8 };
};