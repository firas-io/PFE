# Image Node.js LTS
FROM node:20-alpine

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances (incluant bcrypt qui nécessite une compilation sur Alpine)
RUN apk add --no-cache python3 make g++ && \
    npm install && \
    apk del python3 make g++

# Copie du code source du backend
COPY . .

# Exposition du port
EXPOSE 5000

# Commande de démarrage
CMD ["node", "server.js"]
