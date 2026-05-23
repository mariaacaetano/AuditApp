# Estágio 1: Build do código do React usando uma imagem leve do Node
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de pacotes primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala todas as bibliotecas de forma limpa e sem vulnerabilidades de rede
RUN npm ci

# Copia o restante do código do React
COPY . .

# Compila a aplicação para produção (gera os arquivos estáticos na pasta 'dist' ou 'build')
RUN npm run build

# Estágio 2: Servidor Web Nginx de alto desempenho para produção
FROM nginx:1.25-alpine

# Limpa a página de boas-vindas padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos gerados no Estágio 1 para a pasta do servidor Nginx
# OBS: Se o seu projeto usa Vite, mude "build" para "dist" (e vice-versa se for CRA)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração de rotas e proxy reverso para o contêiner
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do tráfego web
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
