FROM node:18-alpine

WORKDIR /app

# Copiamos manifiestos de paquetes
COPY package*.json ./

# Limpiamos caché previa e instalamos dependencias desde cero
RUN rm -rf node_modules package-lock.json && npm install --no-audit --no-fund

# Copiamos el resto del código
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
