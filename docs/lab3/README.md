# Лабораторная работа №3 — REST API «Теплощит»

Продолжение общего NestJS-проекта для SPA по теме «оценка эффективности теплоизоляции здания». Услуга предметной области — карточка теплоизоляционного материала. Данные хранятся в PostgreSQL через TypeORM, изображения и короткие видео загружаются файлами в MinIO.

## Запуск

Требования: Node.js 22+, Docker Desktop.

```bash
cp .env.example .env
docker compose up -d
npm ci
npm run build
npm start
```

При первом запуске TypeORM применит новые миграции. Затем при необходимости выполните `database/adminer-seed.sql` в Adminer на `http://localhost:8080` и загрузите демонстрационные медиа командой `npm run minio:seed`. API доступно на `http://localhost:3000`, MinIO Console — на `http://localhost:9011`.

## Зафиксированный пользователь

До реализации авторизации текущий создатель — пользователь с `user_id = 1`. Он задаётся ровно в одном месте функцией-singleton `getCurrentUser()` в `src/auth/current-user.ts`. Замыкание создаёт неизменяемый объект один раз, а все методы сервиса получают тот же экземпляр.

## HTTP API

Все адреса начинаются с `/api`. Ответы имеют JSON-формат. Удалённые записи не возвращаются ни списком, ни лентой.

| Метод и URL | Назначение | Входные данные | Результат |
|---|---|---|---|
| `GET /api/insulation-materials` | Список опубликованных услуг | `maxThicknessMm`, `insulationType`, `search` | `{ items, count }`; элемент содержит 7 полей, включая `isCreator: 0/1` |
| `GET /api/insulation-materials/feed` или `/feed/:id?next=true` | Один метод ленты с двумя вариантами URL | без id — начало ленты; только `id` вместе с `next=true` — следующий элемент | 9 полей; `liked: 0/1`, без `isCreator` и системных полей |
| `GET /api/insulation-materials/draft` | Единственный черновик текущего пользователя | id не передаётся | Объект или `null` |
| `POST /api/insulation-materials` | Создать черновик и загрузить медиа | `multipart/form-data`: `name`, `shortDescription`, `insulationType`, `thicknessMm`, файлы `image`, `video` | Созданный черновик, `201` |
| `PUT /api/insulation-materials/:id/publish` | Опубликовать собственный черновик | Пустое тело | Опубликованная услуга |
| `DELETE /api/insulation-materials/:id` | Логически удалить свою услугу | — | `204`; устанавливаются `deleted` и `completedAt` |
| `POST /api/insulation-materials/:id/like` | Поставить или снять лайк | JSON `{ "liked": 1 }` или `{ "liked": 0 }` | Итоговые `liked` и `likeCount` |
| `POST /api/users/register` | Зарегистрировать пользователя | JSON: `email`, `displayName`, `password` | Пользователь без hash пароля, `201` |
| `POST /api/users/authenticate` | Заглушка до лабораторной №4 | — | `implemented: false` |
| `POST /api/users/logout` | Заглушка до лабораторной №4 | — | `implemented: false` |

Разрешены только переходы `draft → published` и `draft/published → deleted`. Вернуть запись в черновик нельзя. Публиковать и удалять можно только записи текущего пользователя. `id`, `status`, `creatorId`, `moderatorId` и системные даты запрещены во входных данных и вычисляются бэкендом. Повторный лайк идемпотентен благодаря уникальному индексу.

Имя объекта MinIO генерируется на сервере в латинице (`image-<timestamp>-<uuid>.<ext>`). В БД сохраняется имя, сериализатор отдельно формирует публичный URL. Размер одного файла ограничен 20 МБ; поля `image` и `video` проверяются по MIME-типу.

## Таблицы БД

### `users`

| Поле | Тип | Ограничения |
|---|---|---|
| `user_id` | `serial` | PK |
| `email` | `varchar(254)` | NOT NULL, UNIQUE |
| `display_name` | `varchar(100)` | NOT NULL |
| `password_hash` | `varchar(255)` | NOT NULL; scrypt + случайная соль |

### `insulation_materials`

| Поле | Тип | Назначение |
|---|---|---|
| `insulation_material_id` | `serial` | PK |
| `name` | `varchar(120)` | Название услуги |
| `short_description` | `varchar(300)` | Краткое описание |
| `status` | enum | `draft`, `published`, `deleted` |
| `image_url` | `varchar(500)` | Имя объекта изображения в MinIO (историческое имя столбца) |
| `video_url` | `varchar(500)` | Имя объекта видео в MinIO (историческое имя столбца) |
| `insulation_type` | `varchar(50)` | Тип утеплителя |
| `thickness_mm` | `smallint` | Толщина 1–1000 мм |
| `created_at` | `timestamptz` | Дата создания, вычисляется БД |
| `published_at` | `timestamptz` | Дата формирования/публикации |
| `completed_at` | `timestamptz` | Дата завершения/удаления |
| `creator_id` | `integer` | FK → `users`, NOT NULL |
| `moderator_id` | `integer` | FK → `users`, nullable; зарезервировано для следующей логики |

Частичный уникальный индекс разрешает не более одного черновика на создателя.

### `insulation_material_likes`

| Поле | Тип | Ограничения |
|---|---|---|
| `insulation_material_like_id` | `serial` | PK |
| `user_id` | `integer` | FK → `users` |
| `insulation_material_id` | `integer` | FK → `insulation_materials` |

Пара `(user_id, insulation_material_id)` уникальна.

## Материалы к показу

- `postman/Лабораторная-3.postman_collection.json` — ровно 10 уникальных методов API: 3 GET, 5 POST, 1 PUT и 1 DELETE. Лента хранится одним GET-запросом и показывается с двумя URL; лайк хранится одним POST-запросом и показывается со значением `liked` 1 или 0. Перед запуском выберите локальные файлы для полей `image` и `video` в запросе создания.
- `database/lab3-demo-reset.sql` — освобождает черновик пользователя 1 перед повторным показом коллекции.
- `database/lab3-screenshot-selects.sql` — три SELECT для скриншотов 11–13.
- `docs/lab3/CLASS-DIAGRAM.md` — диаграмма классов: 4 страницы SPA, URL-домены, методы, модели и таблицы.
- `docs/lab3/CONTROL-QUESTIONS.md` — ответы на контрольные вопросы.
- `docs/lab3/DEFENSE.md` — сценарий скриншотов 1–17.

## Проверка

После запуска контейнеров, применения seed и загрузки MinIO выполните `npm test`. Компиляция отдельно проверяется командой `npm run build`.
