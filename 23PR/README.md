# Практика 23

В этой работе backend запускается в Docker.

Есть несколько контейнеров с Node.js и один контейнер с Nginx.

Nginx распределяет запросы между backend-серверами.

## Что есть

- `backend1`
- `backend2`
- `backend3` как запасной сервер
- `Dockerfile`
- `docker-compose.yml`
- конфиг Nginx

## Запуск

```powershell
docker compose up --build
```

После запуска сайт будет доступен тут:

```text
http://localhost:8080
```

## Проверка

Можно несколько раз выполнить:

```powershell
curl http://localhost:8080
curl http://localhost:8080/health
curl http://localhost:8080/info
```

В ответе будет видно, какой backend обработал запрос.

## Проверка отказа

Можно остановить один backend:

```powershell
docker compose stop backend1
```

Потом снова проверить:

```powershell
curl http://localhost:8080
```

Запросы должны продолжить работать через другие контейнеры.

## Остановка

```powershell
docker compose down
```

## Файл задания

```text
Задание_23.pdf
```
