# 🧠 SCHEDULER (time trigger system)

##

## 🎯 Vai trò

“đúng giờ thì bắn event / job”

---

## 📦 Scheduler chứa gì

### 1. Cron jobs

```bash
expire-booking.job.ts
release-seat.job.ts
sync-movie.job.ts
```

---

### 2. Redis-based scheduling (rất quan trọng với cinema)

```bash
delayed-jobs/
  booking-expire.scheduler.ts
```

👉 ví dụ:

- đặt vé → set TTL 10 phút
- hết TTL → push worker

---

### 3. Trigger event emitter

```bash
event-triggers/
  booking.trigger.ts
```

👉 chỉ làm 1 việc:

```text
cron → emit event → worker xử lý
```

---

## ❌ Scheduler KHÔNG làm

- gửi email
- generate QR
- payment logic

---
