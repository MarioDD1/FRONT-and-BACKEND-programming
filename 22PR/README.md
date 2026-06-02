# Практика 22

В этой работе показана балансировка нагрузки.

Есть несколько backend-серверов на Express.

Запросы можно распределять через:

- Nginx
- HAProxy

## Что есть

- `backend-1` на порту `3000`
- `backend-2` на порту `3001`
- запасной `backend-backup` на порту `3002`
- конфиг Nginx
- конфиг HAProxy

## Запуск backend

Сначала установить зависимости:

```powershell
npm install
```

Потом открыть три терминала и запустить:

```powershell
npm run start:backend1
npm run start:backend2
npm run start:backup
```

## Проверка backend

```powershell
curl http://localhost:3000
curl http://localhost:3001
curl http://localhost:3002
```

Еще есть маршрут:

```text
/info
```

## Nginx

Конфиг лежит тут:

```text
nginx/nginx.conf
```

После подключения конфига балансировщик будет доступен на:

```text
http://localhost:8080
```

## HAProxy

Конфиг лежит тут:

```text
haproxy/haproxy.cfg
```

После подключения конфига HAProxy будет доступен на:

```text
http://localhost:8081
```

## Файл задания

Файл задания добавлен:

```text
Задание_22.pdf
```
