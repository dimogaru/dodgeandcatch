FROM node:18-alpine
WORKDIR /app

# Copia los manifestos
COPY package*.json ./

# Fuerza la instalación limpia de dependencias
RUN npm install --production=false --force

# Copia el resto del código
COPY . .

EXPOSE 3000
CMD ["npm", "start"]