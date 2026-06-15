# Frontend Applications Structure (Next.js)

Dài hạn và khả năng mở rộng cho cả `web-user` và `web-admin` được quản lý thông qua cấu trúc **Feature-Based (Modular)** kết hợp với **Next.js App Router**.

---

## 1. What is this?

Tài liệu này mô tả cấu trúc thư mục tiêu chuẩn cho cả hai ứng dụng Frontend:

- [web-user](file:///d:/About%20Me/Cine_Project/cinema/apps/web-user) (Cổng đặt vé xem phim cho khách hàng)
- [web-admin](file:///d:/About%20Me/Cine_Project/cinema/apps/web-admin) (Trang quản trị hệ thống Cinema)

Cả hai ứng dụng đều chia sẻ chung một bộ khung thư mục dưới thư mục `src/`:

```text
src/
├── app/                  # Next.js App Router (Routing, Layouts toàn cục, Providers)
│   ├── global.css        # Cấu hình Tailwind CSS v4 toàn cục
│   ├── layout.tsx        # Layout gốc của ứng dụng (Root Layout)
│   ├── page.tsx          # Trang chủ chính (thường import và render từ features)
│   └── providers/        # Context Providers (QueryClient, Auth, Theme, v.v.)
├── assets/               # Hình ảnh tĩnh, icons dùng trực tiếp trong app
├── components/           # UI Components dùng chung toàn hệ thống (Button, Modal, Input,...)
├── config/               # Cấu hình runtime và build-time của ứng dụng
├── features/             # Nơi chứa các module nghiệp vụ (Trọng tâm cấu trúc)
│   └── <feature-name>/   # Module nghiệp vụ cụ thể (ví dụ: auth, booking, home,...)
│       ├── api/          # Lệnh gọi API cụ thể cho feature này (React Query hooks)
│       ├── components/   # UI components chỉ dùng riêng trong feature này
│       ├── hooks/        # Custom hooks riêng của feature
│       ├── pages/        # Các Page component (được import vào app/*)
│       ├── services/     # Logic nghiệp vụ, xử lý dữ liệu phức tạp
│       └── types/        # Định nghĩa kiểu dữ liệu (TypeScript Types/Interfaces)
├── layouts/              # Các cấu trúc layout lớn (Header, Footer, Sidebar layouts)
└── global.d.ts           # Khai báo kiểu dữ liệu toàn cục
```

---

## 2. Where is the source of truth?

- **Định tuyến (Routing):** Thư mục [src/app](file:///d:/About%20Me/Cine_Project/cinema/apps/web-user/src/app) là nơi Next.js quản lý URL. Để giữ sạch thư mục này, **không nên viết logic hiển thị hoặc API trực tiếp tại đây**. Thay vào đó, các file `page.tsx` chỉ nên import và render Page Component từ thư mục `features/`.
- **Logic Nghiệp vụ (Features):** Thư mục [src/features](file:///d:/About%20Me/Cine_Project/cinema/apps/web-user/src/features) là nơi chứa toàn bộ logic thực thi của từng trang/nghiệp vụ. Mỗi thư mục feature phải tự chứa đầy đủ logic của nó (tự quản lý (self-contained)).
- **Theme & CSS:** [src/app/global.css](file:///d:/About%20Me/Cine_Project/cinema/apps/web-user/src/app/global.css) sử dụng Tailwind CSS v4. Các tùy chỉnh theme được thực hiện qua khai báo `@theme` trực tiếp bằng CSS Variables.

---

## 3. Key Files & Patterns

### Định nghĩa Trang bằng Feature Component

File `src/app/page.tsx` chỉ đóng vai trò là "cổng kết nối" định tuyến:

```tsx
// src/app/page.tsx
'use client';

import { HomePage } from '@/features/home/pages';

export default function Page() {
  return <HomePage />;
}
```

Mọi component và logic thực tế nằm tại `src/features/home/pages/HomePage.tsx`:

```tsx
// src/features/home/pages/HomePage.tsx
import { useEffect } from 'react';
import { config } from '@/config';

export const HomePage = () => {
  // Thực thi API hooks, state hoặc các components nhỏ khác tại đây
  return (
    <div className="flex justify-center items-center">
      <span className="text-8xl font-medium text-white">Home Page</span>
    </div>
  );
};
```

### Sử dụng API Client dùng chung

Các API calls trong `features/<name>/api` nên sử dụng Client được tự động sinh ra từ `@repo/api-client` để đảm bảo đồng bộ kiểu dữ liệu (Type-safety) với NestJS backend.

---

## 4. What should NOT be done?

- ❌ **Không viết trực tiếp các UI phức tạp tại `src/app/`**: Tránh việc tạo các file component phụ trực tiếp bên trong `src/app/`. Hãy di chuyển chúng vào thư mục `features/` tương ứng.
- ❌ **Không để rò rỉ component riêng vào components dùng chung**: Nếu component chỉ được sử dụng ở 1 page (ví dụ: `SeatGrid.tsx` chỉ dùng trong Booking), không được đưa vào `src/components/` toàn cục. Phải đưa vào `src/features/booking/components/`.
- ❌ **Không import chéo các tệp nội bộ giữa các features**: Ví dụ, `features/booking` không được import trực tiếp một helper component nội bộ nằm sâu trong `features/auth/components/...`. Nếu cần dùng chung, hãy cấu trúc lại helper đó ra thư mục `src/components/` toàn cục hoặc thông qua một public API của feature đó.
- ❌ **Không dùng tiền tố `VITE_`**: Cả hai dự án đều chạy Next.js. Mọi biến môi trường phía client bắt buộc phải có tiền tố `NEXT_PUBLIC_` (ví dụ: `NEXT_PUBLIC_API_ORIGIN`).
