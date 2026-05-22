# 🧠 WORKER (core processing engine)

## 🎯 Vai trò

“Làm tất cả thứ nặng + async + DB + redis + file + email”

---

## 📦 Worker chứa gì

### 1. Event handlers (cốt lõi)

```bash
booking-created.handler.ts
payment-success.handler.ts
ticket-issued.handler.ts
```

---

### 2. Redis jobs (seat locking, expiry)

```bash
seat-lock.service.ts
booking-expiry.processor.ts
```

👉 Redis dùng ở worker là chính:

- lock ghế
- expire booking
- rate limit job

---

### 3. Ticket system (QR / barcode)

```bash
ticket/
  qr-generator.service.ts
  barcode.generator.ts
  ticket.builder.ts
```

👉 Worker là nơi:

- generate QR code
- encode booking → ticket payload

---

### 4. Email (Resend / Mailhog abstraction)

```bash
email/
  email.service.ts
  templates/
    booking-confirmed.hbs
    ticket-ready.hbs
```

---

### 5. File processing (poster/banner nếu cần async)

```bash
file/
  upload.processor.ts
  image.optimize.service.ts
```

---

### 6. DB write-heavy logic (Postgres)

```bash
booking.service.ts
ticket.service.ts
payment.service.ts
```

---

## ❌ Worker KHÔNG làm

- webhook receive
- cron schedule
- HTTP controller
