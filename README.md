# PolyglotDesktop 🌐

> **Trợ Lý Học Tiếng Trung & Tiếng Anh Toàn Diện Cho Người Việt Trên Máy Tính**  
> *AI-Powered Cross-Platform Desktop Language Learning Companion for Vietnamese Native Speakers*

---

## 🌟 Tổng Quan Sản Phẩm (Product Overview)

**PolyglotDesktop** là ứng dụng desktop hiện đại, chạy mượt mà trên Windows, macOS và Linux, được tối ưu hóa đặc biệt cho người Việt học:
- **Tiếng Trung Giản Thể (Simplified Chinese)**: Mục tiêu chính (HSK 1–6, Pinyin thanh điệu, chiết tự, bóc tách từ vựng, ngữ pháp, phát hiện lỗi ngữ pháp người Việt).
- **Tiếng Anh (English)**: Mục tiêu thứ hai (CEFR A1–C2, phiên âm IPA, cụm từ kết hợp Collocations, ngữ pháp tự nhiên).

Ứng dụng kết hợp sức mạnh của 7 công cụ trong 1:
1. **Dịch màn hình & Game (Screen Translation)**: Phím tắt toàn hệ thống `Ctrl + Shift + T` đóng băng màn hình, khoanh vùng kéo chuột, tự động nhận diện chữ (OCR) và bật cửa sổ dịch nổi tức thì.
2. **Quét chữ OCR (OCR Scanner)**: Hỗ trợ ảnh chụp, tài liệu PDF, truyện tranh, kéo thả hoặc dán từ clipboard (`Ctrl + Shift + O`).
3. **Dịch giọng nói trực tiếp (Real-time Voice Translator)**: Thu âm micro, nhận diện luồng giọng nói trực tiếp (Streaming STT) và dịch song song (`Ctrl + Shift + L`).
4. **Phụ đề nổi màn hình & Video (Live Subtitles Overlay)**: Thanh phụ đề nổi ghim trên mọi cửa sổ game/phim/YouTube, hỗ trợ Pinyin, tùy chỉnh độ trong suốt và chế độ xuyên chuột (Click-through) (`Ctrl + Shift + S`).
5. **Sổ từ vựng & Thẻ Flashcards (SuperMemo SM-2 SRS)**: Tự động tạo thẻ flashcard cho mỗi từ vựng được tra cứu hoặc bóc tách, tính toán chu kỳ lặp lại ngắt quãng khoa học.
6. **Luyện tập Nghe & Nói (Practice Center)**: Luyện nghe chép chính tả và luyện nói chấm điểm phát âm với phản hồi ngữ âm.
7. **Gia sư đàm thoại AI (AI Conversation Tutor)**: Đàm thoại phản xạ nhiều chủ đề (Game, du lịch, phỏng vấn, công nghệ...) tự động phát hiện lỗi sai đặc trưng do ảnh hưởng ngôn ngữ mẹ đẻ tiếng Việt.

---

## 🏗 Kiến Trúc Hệ Thống (Architecture)

Ứng dụng tuân thủ nghiêm ngặt mô hình kiến trúc đa tầng, phân tách hoàn toàn giữa Electron Main Process và React Renderer Process:

```text
src/
  ├── main/                     # Electron Main Process (Node.js runtime)
  │   ├── windows/              # Quản lý các loại cửa sổ độc lập
  │   │   ├── mainWindow.ts     # Cửa sổ chính (Dashboard, Sổ từ vựng, Cài đặt...)
  │   │   ├── snipWindow.ts     # Cửa sổ đóng băng chụp & chọn vùng màn hình
  │   │   ├── overlayWindow.ts  # Cửa sổ dịch nổi frameless, ghim trên cùng
  │   │   └── subtitleWindow.ts # Cửa sổ phụ đề trực tiếp nổi
  │   ├── ipc/                  # Hợp đồng IPC strongly-typed qua Zod & Channels
  │   └── services/             # Dịch vụ hệ thống (Screen crop, Global shortcuts, Clipboard, Tray)
  │
  ├── preload/                  # contextBridge bảo mật, tuyệt đối không lộ Node API trực tiếp
  │
  ├── database/                 # SQLite Local-First Database (sql.js / WebAssembly)
  │   ├── schema.ts             # 13 bảng dữ liệu chuẩn hóa
  │   ├── repositories/         # Vocabulary, Flashcards (SM-2), History, Stats, Settings
  │   └── seeds/                # Dữ liệu từ vựng HSK & CEFR phong phú ban đầu
  │
  ├── providers/                # Trừu tượng hóa nhà cung cấp (Provider Abstraction)
  │   ├── translation/          # Google Free (không cần Key), Gemini AI, OpenAI, DeepL
  │   ├── ocr/                  # Tesseract.js (Offline) & Gemini Vision OCR
  │   └── ai/                   # AI Prompts, Phân tích cú pháp, Sửa lỗi người Việt
  │
  ├── shared/                   # Định nghĩa kiểu dữ liệu (Types, IPC Constants, Defaults)
  │
  └── renderer/                 # React 19 + Vite + Tailwind CSS + Lucide + Zustand
      ├── components/           # Layout, TonePinyin, AudioPlayer, WordBreakdownModal
      ├── pages/                # 13 trang chức năng hoàn chỉnh
      ├── windows/              # SnipOverlay, FloatingOverlay, SubtitleOverlay
      ├── stores/               # Zustand state stores
      └── i18n/                 # Đa ngôn ngữ UI: Tiếng Việt (mặc định), English, 简体中文
```

---

## ⌨️ Phím Tắt Toàn Cầu (Global Hotkeys)

| Phím Tắt Mặc Định | Chức Năng | Mô Tả |
| :--- | :--- | :--- |
| `Ctrl + Shift + T` | **Dịch màn hình** | Đóng băng màn hình, khoanh vùng chữ bất kỳ trong game hoặc ứng dụng để dịch ngay |
| `Ctrl + Shift + O` | **Quét chữ OCR** | Kích hoạt công cụ chọn vùng để nhận diện chữ |
| `Ctrl + Shift + S` | **Bật/Tắt Phụ đề nổi** | Bật cửa sổ phụ đề trực tiếp ghim trên game/video |
| `Ctrl + Shift + L` | **Dịch giọng nói** | Mở ngay phòng thu âm dịch nói theo thời gian thực |
| `Ctrl + C` (Tự động) | **Clipboard Translation**| Gợi ý dịch tức thì khi sao chép đoạn văn bản tiếng Trung hoặc tiếng Anh |

*Lưu ý: Mọi phím tắt đều có thể tùy chỉnh lại trong mục **Cài đặt**.*

---

## 🧠 Thuật Toán Ôn Tập Lặp Lại Ngắt Quãng (SuperMemo SM-2)

Flashcard trong ứng dụng sử dụng thuật toán **SuperMemo SM-2** được tinh chỉnh cho việc học ngôn ngữ:
- **1 - Quên (Again)**: Reset số lần lặp về 0, khoảng cách ôn tập là 1 ngày, giảm Ease Factor.
- **2 - Khó (Hard)**: Tăng khoảng cách ôn tập nhẹ (`interval * 1.2`), giảm Ease Factor nhẹ.
- **3 - Tốt (Good)**: Đạt chuẩn nhớ: lần 1 = 1 ngày, lần 2 = 6 ngày, các lần sau = `interval * EaseFactor`.
- **4 - Dễ (Easy)**: Nắm rất vững: lần 1 = 4 ngày, lần 2 = 10 ngày, các lần sau = `interval * EaseFactor * 1.3`, tăng Ease Factor.

Dữ liệu được lưu trữ trực tiếp vào tệp SQLite cục bộ tại `%APPDATA%\polyglot_learning.db`.

---

## 🚀 Cài Đặt & Chạy Ứng Dụng (Setup & Running)

### 1. Yêu cầu môi trường
- Node.js >= 18.0.0
- npm hoặc yarn / pnpm

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường (Tùy chọn)
Sao chép tệp mẫu cấu hình:
```bash
cp .env.example .env
```
Điền `GEMINI_API_KEY` hoặc `OPENAI_API_KEY` nếu bạn muốn sử dụng các tính năng nâng cao của Gia sư AI. Nếu không điền, ứng dụng vẫn hoạt động bình thường với bản dịch Google Free và phân tích cú pháp ngoại tuyến.

### 4. Khởi chạy ở chế độ lập trình (Development)
```bash
npm run dev
```

### 5. Kiểm thử tự động (Unit Tests)
```bash
npm run test
```

### 6. Kiểm tra kiểu TypeScript (Lint)
```bash
npm run lint
```

### 7. Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
Để đóng gói thành bộ cài đặt Windows (NSIS Installer & Portable exe):
```bash
npm run dist
```

---

## 🛡️ Quyền Riêng Tư & An Toàn Dữ Liệu (Privacy & Security)

- **Local-First**: Toàn bộ từ điển, sổ từ, flashcards, lịch sử và thống kê đều được lưu trữ hoàn toàn cục bộ trên máy tính của bạn trong SQLite database.
- **Bảo mật Micro & Màn hình**: Ứng dụng không bao giờ âm thầm thu âm hoặc tải ảnh chụp màn hình lên máy chủ bên thứ ba khi không có hành động chủ động từ người dùng.
- **Không lộ Node.js**: Context isolation được kích hoạt 100%, renderer chỉ giao tiếp qua IPC bridge an toàn đã được kiểm duyệt.

---

## 📄 Bản Quyền (License)

Phát triển bởi Google DeepMind / Antigravity Team. Phát hành theo giấy phép MIT.
