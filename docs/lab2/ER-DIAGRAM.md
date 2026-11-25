# ER-диаграмма для Draw.io

Готовая диаграмма находится в корне лабораторной работы: `ER-диаграмма_Лабораторная_2.drawio`. Формат страницы — A4, альбомная ориентация. Каскадное удаление не используется: все внешние ключи имеют `ON DELETE RESTRICT`.

## users — 4 столбца

| Столбец | PostgreSQL | Ограничения |
|---|---|---|
| `user_id` | `serial` | PK, NOT NULL |
| `email` | `varchar(254)` | NOT NULL, UNIQUE |
| `display_name` | `varchar(100)` | NOT NULL |
| `password_hash` | `varchar(255)` | NOT NULL |

## insulation_materials — 11 столбцов

| Столбец | PostgreSQL | Ограничения |
|---|---|---|
| `insulation_material_id` | `serial` | PK, NOT NULL |
| `name` | `varchar(120)` | NOT NULL |
| `short_description` | `varchar(300)` | NULL для черновика; обязательно при публикации |
| `status` | `enum` | `draft`, `published`, `deleted`; NOT NULL |
| `image_url` | `varchar(500)` | NULL, необязательно |
| `video_url` | `varchar(500)` | NULL, необязательно |
| `insulation_type` | `varchar(50)` | предметное поле №1; обязательно при публикации |
| `thickness_mm` | `smallint` | предметное поле №2; обязательно при публикации; CHECK > 0 |
| `created_at` | `timestamptz` | дата создания; NOT NULL, DEFAULT now() |
| `published_at` | `timestamptz` | дата формирования; NULL до публикации |
| `creator_id` | `integer` | FK → `users.user_id`, NOT NULL, RESTRICT |

Частичный уникальный индекс `UNIQUE (creator_id) WHERE status = 'draft'` гарантирует не более одного черновика на пользователя.

## insulation_material_likes — 3 столбца

| Столбец | PostgreSQL | Ограничения |
|---|---|---|
| `insulation_material_like_id` | `serial` | PK, NOT NULL |
| `user_id` | `integer` | FK → `users.user_id`, NOT NULL, RESTRICT |
| `insulation_material_id` | `integer` | FK → `insulation_materials.insulation_material_id`, NOT NULL, RESTRICT |

Ограничение `UNIQUE (user_id, insulation_material_id)` запрещает повторный лайк. Таблица реализует связь M:N пользователей и услуг.

## Обязательность полей формы

- После кнопки «Далее» в БД создаётся черновик. Обязательно только `name`; фото и видео необязательны и на сервер не передаются.
- Перед кнопкой «Опубликовать» обязательны `short_description`, `insulation_type`, `thickness_mm`.
- Для черновика эти три поля могут быть `NULL`, поскольку заполняются на следующем этапе.
