-- Восстанавливает шесть карточек ЛР5 в текущей БД, не изменяя существующие записи.
-- Повторное выполнение безопасно: уже существующие id пропускаются.
INSERT INTO insulation_materials
  (insulation_material_id, name, short_description, status, image_url, video_url,
   insulation_type, thickness_mm, creator_id, published_at, price_rub_m2, brand, application)
VALUES
  (1, 'Технолайт Оптима', 'Негорючие плиты из каменной ваты для тепло- и звукоизоляции каркасных конструкций.', 'published', 'technolight-optima-50.jpg', 'technolight-optima-50.mp4', 'Минеральная вата', 50, 1, '2026-10-28 09:30:00+03', 281.60, 'ТЕХНОНИКОЛЬ', 'Каркасные стены'),
  (2, 'Технолайт Экстра', 'Лёгкая базальтовая теплоизоляция для ненагружаемых конструкций частного дома.', 'published', 'technolight-extra-50.jpg', NULL, 'Минеральная вата', 50, 1, '2026-10-24 14:20:00+03', 229.63, 'ТЕХНОНИКОЛЬ', 'Ненагружаемые конструкции'),
  (3, 'THERM ППС15', 'Практичный пенополистирол для утепления полов, перекрытий и других конструкций.', 'published', 'rafinad-therm-50.jpg', 'rafinad-therm-50.mp4', 'Пенополистирол', 50, 1, '2026-10-19 11:15:00+03', 322.22, 'RAFINAD', 'Полы и перекрытия'),
  (4, 'THERM FACADE', 'Фасадная плита со стабильной геометрией для систем наружного утепления под штукатурку.', 'published', 'rafinad-facade-50.jpg', 'rafinad-facade-50.mp4', 'Пенополистирол', 50, 1, '2026-10-15 16:40:00+03', 322.22, 'RAFINAD', 'Фасады под штукатурку'),
  (5, 'LOGICPIR Баня', 'PIR-плита с фольгированной облицовкой для тёплого и долговечного контура бани.', 'published', 'logicpir-banya-50.jpg', 'logicpir-banya-50.mp4', 'PIR-плита', 50, 1, '2026-10-10 10:00:00+03', 1038.60, 'ТЕХНОНИКОЛЬ', 'Бани и сауны'),
  (6, 'LOGICPIR СХМ/СХМ', 'Энергоэффективная PIR-плита для кровель, стен и конструкций с ограниченной толщиной.', 'published', 'logicpir-skhm-50.jpg', NULL, 'PIR-плита', 50, 1, '2026-10-03 12:10:00+03', 1570.15, 'ТЕХНОНИКОЛЬ', 'Кровли и слоистые стены')
ON CONFLICT (insulation_material_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('insulation_materials', 'insulation_material_id'),
              (SELECT max(insulation_material_id) FROM insulation_materials));
