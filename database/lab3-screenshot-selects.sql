-- Скриншот 11: созданная/опубликованная/логически удалённая услуга и системные поля.
SELECT insulation_material_id, name, status, image_url, video_url,
       creator_id, moderator_id, created_at, published_at, completed_at
FROM insulation_materials
ORDER BY insulation_material_id DESC;

-- Скриншот 12: изменение лайка от зафиксированного пользователя 1.
SELECT insulation_material_like_id, user_id, insulation_material_id
FROM insulation_material_likes
ORDER BY insulation_material_like_id DESC;

-- Скриншот 13: зарегистрированный пользователь; hash демонстрируется без пароля.
SELECT user_id, email, display_name, password_hash
FROM users
ORDER BY user_id DESC;
