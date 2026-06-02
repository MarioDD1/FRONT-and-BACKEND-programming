# Практика 21

В этой работе сделан сервер на Express.

Главная тема работы - Redis-кэш.

## Что есть

- регистрация;
- вход по email и паролю;
- JWT-токены;
- роли пользователей;
- список пользователей;
- список товаров;
- кэширование через Redis.

## Роли

Есть три роли:

- `user`
- `seller`
- `admin`

Администратор создается при запуске сервера.

Данные по умолчанию:

```text
email: admin@example.com
password: admin123
```

## Маршруты

```text
GET /
GET /health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET /api/auth/me
GET /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
POST /api/products
GET /api/products
GET /api/products/:id
PUT /api/products/:id
DELETE /api/products/:id
```

Товары можно фильтровать по категории:

```text
GET /api/products?category=electronics
```

## Запуск

```powershell
npm install
Copy-Item .env.example .env
docker run -d --name redis-pr21 -p 6379:6379 redis
npm start
```

Сервер обычно запускается тут:

```text
http://localhost:3000
```

## Файл задания

```text
Задание_21.pdf
```
