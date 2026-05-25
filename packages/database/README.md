# Setup

```bash
pnpm add -D prisma
```

```bash
pnpm add @prisma/client @prisma/adapter-pg
```

```bash
pnpm exec prisma init
```

# OPTIONAL / UTILITIES

### Introspect existing database

```bash
pnpm prisma db pull
```

- Sync schema từ database → `schema.prisma`
- Dùng khi làm việc với database có sẵn

### Validate schema

```bash
pnpm prisma validate
```

- Kiểm tra syntax/config của Prisma schema
- Hữu ích trước khi migrate hoặc deploy

### Format schema

```bash
pnpm prisma format
```

- Format lại `schema.prisma`
- Giúp schema đồng nhất và dễ đọc

### Prisma Studio

```bash
pnpm prisma studio
```

- GUI để xem/edit dữ liệu local
- Hữu ích khi debug hoặc kiểm tra seed data

---

# DEV FLOW (pnpm)

### Tạo & apply migration

```bash
pnpm prisma migrate dev
```

- Tạo migration từ `schema.prisma`
- Apply vào database
- Tự động generate Prisma Client

### Seed data (optional)

```bash
pnpm prisma db seed
```

- Chạy script seed để tạo dữ liệu mẫu
- Thường dùng cho local/dev

### Test nhanh (không migration)

```bash
pnpm prisma db push
```

- Sync schema trực tiếp vào DB
- Không tạo migration (không dùng cho production)

```bash
pnpm prisma generate
```

- Generate lại Prisma Client
- Cần khi dùng `db push` hoặc khi client bị lệch

### Khi pull code mới

```bash
pnpm install
```

- Cài dependencies mới

```bash
pnpm prisma generate
```

- Đồng bộ Prisma Client với schema mới từ repo
- Tránh lỗi runtime do client cũ

### Reset database

```bash
pnpm prisma migrate reset
```

- Xoá toàn bộ database
- Chạy lại tất cả migration
- Tự động chạy seed (nếu có config)

---

# DEPLOY FLOW (PROD / CI)

### Install dependencies

```bash
pnpm install
```

- Cài dependencies trong môi trường deploy

### Apply migration

```bash
pnpm prisma migrate deploy
```

- Chỉ apply các migration đã commit
- Không tạo migration mới

### Generate Prisma Client

```bash
pnpm prisma generate
```

- Đảm bảo client đúng version với schema
- Quan trọng trong CI/CD và Docker build

### Seed data (optional)

```bash
pnpm prisma db seed
```

- Dùng khi cần dữ liệu ban đầu (ví dụ: roles, config)

# NOTE

### Không dùng trong production

```bash
pnpm prisma migrate dev
```

- Có thể tạo migration ngoài ý muốn

```bash
pnpm prisma db push
```

- Bỏ qua migration → dễ gây lệch schema
