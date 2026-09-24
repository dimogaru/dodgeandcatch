FROM node:18-alpine

WORKDIR /app

# Copiamos los archivos de manifiesto
COPY package*.json ./

# Instalamos dependencias omitiendo auditorías pesadas que cuelgan el proceso de build
RUN npm install --no-audit --no-fund

# Copiamos todo el resto del código
COPY . .

# Exponemos el puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
