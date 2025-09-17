# مرحلة البناء
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN pnpm i --frozen-lockfile
COPY . .
RUN pnpm build

# مرحلة Nginx
FROM nginx:alpine
# إزالة الكونفج الافتراضي
RUN rm -f /etc/nginx/conf.d/default.conf
# إضافة كونفج خاص يقدّم الـ SPA ويعمل proxy لـ /api
COPY nginx.conf /etc/nginx/conf.d/default.conf
# نسخ ملفات البناء
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]