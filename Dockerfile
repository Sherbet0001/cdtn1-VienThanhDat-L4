# ---------- GIAI ĐOẠN 1: cài phụ thuộc đúng theo package-lock.json ----------
FROM node:20-alpine AS deps
WORKDIR /app
# Chép RIÊNG tệp khoá trước để Docker dùng lại lớp cache khi chỉ mã nguồn đổi
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- GIAI ĐOẠN 2: ảnh chạy ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Chạy bằng người dùng không đặc quyền
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY web ./web
COPY migrations ./migrations
COPY seeds ./seeds
USER app
EXPOSE 3000
# Docker Compose dựa vào đây để biết api đã sẵn sàng (/health kiểm cả kết nối CSDL)
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Dựng bảng và nạp dữ liệu mẫu (chạy lại được, không nhân đôi) rồi mới khởi động máy chủ
CMD ["sh", "-c", "node src/db/runner.js migrations && node src/db/runner.js seeds && node src/server.js"]
