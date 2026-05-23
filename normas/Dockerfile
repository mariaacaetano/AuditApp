# Usa uma imagem oficial estável e leve do Python
FROM python:3.11-slim

# Evita que o Python grave arquivos .pyc e faça buffering no terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define onde o projeto vai rodar dentro do contêiner
WORKDIR /app

# Instala dependências de sistema necessárias para compilar bibliotecas MySQL no Linux do contêiner
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as bibliotecas Python (para aproveitar o cache do Docker)
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copia o código do seu Django para o contêiner
COPY . /app/

# Expõe a porta interna do Django
EXPOSE 8000