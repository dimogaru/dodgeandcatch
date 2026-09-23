FROM node:18-alpine
WORKDIR /app

# Copia los manifestos e instala las dependencias sin omitir ninguna
COPY package*.json ./
RUN npm install

# Copia el resto de archivos del proyecto
COPY . .

EXPOSE 3000
CMD ["npm", "start"]