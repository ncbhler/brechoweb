# BrechoWeb

Frontend mobile-first para catalogo de produtos de um brecho, com foco em performance, visual premium e integracao simples com API.

## Stack

- Vite
- React
- TypeScript
- CSS customizado com abordagem mobile-first

## Como configurar

1. Instale o Node.js 20+ no ambiente.
2. Instale as dependencias:

```bash
npm install
```

3. Crie um arquivo `.env` com base em `.env.example`:

```bash
VITE_API_URL=https://sua-api.com/products
```

4. Rode o projeto:

```bash
npm run dev
```

## Formato esperado da API

O frontend aceita respostas nos formatos abaixo:

```json
[
  {
    "id": "1",
    "name": "Vestido midi",
    "description": "Descricao da peca",
    "price": 129.9,
    "imageUrl": "https://...",
    "category": "Vestidos",
    "size": "M",
    "condition": "Excelente",
    "featured": true,
    "isNew": true
  }
]
```

ou

```json
{
  "products": [
    {
      "id": "1",
      "name": "Vestido midi"
    }
  ]
}
```

Tambem ha tolerancia para chaves como `title`, `valor`, `image`, `image_url`, `categoria`, `tamanho` e `condicao`.

## Observacoes

- Sem `VITE_API_URL`, o projeto exibe um catalogo de demonstracao.
- As imagens de demonstracao usam geracao visual para manter a vitrine apresentavel mesmo sem backend conectado.
- O ambiente atual em que o projeto foi gerado nao possui `node`/`npm` disponiveis no terminal, entao a instalacao e o build nao puderam ser executados aqui.
