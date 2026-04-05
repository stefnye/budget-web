# Budget Web

Frontend web (PWA) for the Budget app, built with React + Vite + Tailwind CSS.

## Setup

```bash
npm install
cp .env.example .env  # edit VITE_API_URL
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Docker

```bash
docker build -t budget-web .
docker run -p 80:80 budget-web
```
