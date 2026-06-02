# Практика 19

Простое CRUD API для пользователей.

Проект сделан на:

- Express
- PostgreSQL
- pg
- dotenv

## Что есть

Сервер умеет:

- добавлять пользователя;
- получать список пользователей;
- получать одного пользователя по id;
- изменять данные пользователя;
- удалять пользователя.

## Поля пользователя

У пользователя есть:

- `id`
- `first_name`
- `last_name`
- `full_name`
- `age`
- `created_at`
- `updated_at`

## Маршруты

```text
GET /health
GET /
POST /api/users
GET /api/users
GET /api/users/:id
PATCH /api/users/:id
DELETE /api/users/:id
```

Список пользователей можно немного отсортировать:

```text
GET /api/users?sort=age&direction=desc
```

## Запуск

Сначала установить зависимости:

```powershell
npm install
```

Потом создать `.env` из примера:

```powershell
Copy-Item .env.example .env
```

Запустить сервер:

```powershell
npm start
```

Обычно сервер запускается тут:

```text
http://localhost:3000
```


Проверить маршруты API
Главные маршруты:

POST /api/users
GET /api/users
GET /api/users/:id
PATCH /api/users/:id
DELETE /api/users/:id

Добавить пользователя

curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d "{\"first_name\":\"Иван\",\"last_name\":\"Иванов\",\"age\":20}"

Посмотреть список пользователей
http://localhost:3000/api/users

Изменить пользователя
Например, если id пользователя 1:

curl -X PATCH http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d "{\"age\":21}"

Удалить пользователя
curl -X DELETE http://localhost:3000/api/