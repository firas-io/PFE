# Image Node.js LTS (Alpine — requis pour apk / compilation native de bcrypt)
FROM node:20-alpine

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Outils de build pour bcrypt, puis nettoyage pour réduire la taille de l'image
RUN apk add --no-cache python3 make g++ && \
    npm install && \
    apk del python3 make g++

# Copie du code source du backend
COPY . .

# Exposition du port
EXPOSE 5000

# Commande de démarrage
CMD ["node", "--import", "./src/loader.js", "server.js"]
