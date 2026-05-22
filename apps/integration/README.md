# 🧠 INTEGRATIONS (external world gateway)

## 🎯 Vai trò

“mọi thứ từ bên ngoài đi vào hệ thống”

---

## 📦 Integrations chứa gì

---

### 1. Payment webhooks (rất quan trọng)

```bash
payment/
  stripe.controller.ts
  momo.controller.ts
  webhook.validator.ts
```

👉 nhiệm vụ:

- verify signature
- parse event
- emit internal event

```text
Stripe → webhook → PaymentSucceeded → worker
```

---

### 2. File storage adapter (poster/banner)

```bash
storage/
  s3.client.ts (hoặc local dev)
  upload.controller.ts
```

---

### 3. Email provider adapter

```bash
email/
  resend.client.ts
  mailhog.client.ts
```

👉 worker gọi qua abstraction

---

### 4. External API mapping layer

```bash
mappers/
  stripe.mapper.ts
  momo.mapper.ts
```

---

## ❌ Integrations KHÔNG làm

- business logic booking
- ticket logic
- redis logic
- queue processing
