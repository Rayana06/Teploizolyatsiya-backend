# Порядок показа — лабораторная №3

Перед показом: запустить compose и приложение, применить `database/adminer-seed.sql`, затем `database/lab3-demo-reset.sql`, выполнить `npm run minio:seed`, импортировать коллекцию Postman. Во втором запросе повторно выбрать файлы изображения и видео, если Postman не сохранил локальные пути.

1. Показать всю коллекцию из 10 уникальных методов. Обратить внимание преподавателя: в ней ровно 3 GET, 5 POST, 1 PUT и 1 DELETE.
2. Выполнить GET списка с `maxThicknessMm=80&insulationType=Минвата`.
3. POST создания услуги: показать `multipart/form-data`, где `image` и `video` имеют тип File.
4. GET `/draft` без id: показать созданный черновик и имена объектов MinIO.
5. PUT публикации: показать смену `draft` на `published` и серверную дату.
6. Один GET ленты выполнить сначала без id, затем в том же запросе заменить URL на `/feed/:id?next=true`.
7. Один POST лайка выполнить с `liked: 1`; для отмены в этом же запросе используется `liked: 0`.
8. DELETE услуги: показать статус `204`.
9. POST регистрации нового пользователя.
10. POST-заглушки аутентификации и деавторизации находятся в коллекции и возвращают `implemented: false`.
11–13. Выполнить три SELECT из `database/lab3-screenshot-selects.sql`.
14. Показать три entity-класса в `src/database/entities`.
15. Показать `InsulationMaterialSerializer`, `UserSerializer`, скрытие `passwordHash` и формирование URL MinIO.
16. Показать `src/auth/current-user.ts`, затем вызовы `getCurrentUser()` в API-сервисе.
17. Показать разделы «HTTP API» и «Таблицы БД» в README.

Для объяснения архитектуры открыть `docs/lab3/CLASS-DIAGRAM.md`; ответы на теорию находятся в `docs/lab3/CONTROL-QUESTIONS.md`.
