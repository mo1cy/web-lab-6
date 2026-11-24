# Сервіс скорочення посилань

## Запуск
1. Скопіюйте `.env.sample` у `.env` і задайте пароль:
   ```
   cp .env.sample .env
   ```
2. Запустіть:
   ```
   docker compose up --build
   ```
3. Сервер: http://localhost:8080, перевірка: http://localhost:8080/health

## Зупинка
- `docker compose down`: зупинити, дані зберігаються
- `docker compose down --volumes`: зупинити і видалити дані