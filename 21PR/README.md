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

Перейди в папку:
cd C:\Users\user\Project\FRONT_and_BACKEND_programming\21PR
Установи зависимости:
npm install
Создай .env:
Copy-Item .env.example .env
Запусти Redis.
Если есть Docker:

docker run -d --name redis-pr21 -p 6379:6379 redis
Если контейнер уже был создан:

docker start redis-pr21
Запусти сервер:
npm start
Сервер будет тут:

http://localhost:3000
Проверка:

Invoke-RestMethod http://localhost:3000/health
Что нужно сделать по работе:

Войти под админом:
$login = Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@example.com","password":"admin123"}'
Сохранить токен:
$token = $login.accessToken
Проверить свой профиль:
Invoke-RestMethod -Uri http://localhost:3000/api/auth/me -Headers @{ Authorization = "Bearer $token" }
Проверить список пользователей:
Invoke-RestMethod -Uri http://localhost:3000/api/users -Headers @{ Authorization = "Bearer $token" }
Первый раз ответ будет:

"source": "server"
Второй раз:

"source": "cache"
Проверить товары:
Invoke-RestMethod -Uri http://localhost:3000/api/products -Headers @{ Authorization = "Bearer $token" }
Повтори команду второй раз, чтобы увидеть кэш.

Проверить фильтр товаров:
Invoke-RestMethod -Uri "http://localhost:3000/api/products?category=electronics" -Headers @{ Authorization = "Bearer $token" }
