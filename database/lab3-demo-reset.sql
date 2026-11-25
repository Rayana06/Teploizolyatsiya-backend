-- Выполнить перед повторным прогоном коллекции лабораторной №3.
-- Освобождает единственное место черновика пользователя 1 и удаляет прежнего demo-пользователя.
DELETE FROM insulation_material_likes
WHERE insulation_material_id IN (
  SELECT insulation_material_id FROM insulation_materials
  WHERE creator_id = 1 AND name = 'Эковата Demo Lab 3'
);
DELETE FROM insulation_materials
WHERE creator_id = 1 AND (status = 'draft' OR name = 'Эковата Demo Lab 3');
DELETE FROM users WHERE email LIKE 'lab3.%@teploshchit.local';
