FROM node:22-slim
WORKDIR /app
COPY server.js views.js bulk.js ./
COPY public ./public
COPY seed ./seed
COPY docker-entrypoint.sh ./
ENV PORT=8080
EXPOSE 8080
RUN chmod +x docker-entrypoint.sh
CMD ["sh", "docker-entrypoint.sh"]
