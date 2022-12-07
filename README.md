```javascript
Автор: Федюнин Никита Дмитриевич

из зависимостей требуется mysql:3306

npm run:
    # все команды нужно запускать из корня проекта
    - migrate, создаем таблицу в бд
    - login,   подготовка браузера к парсингу, входим в учетку и сохраняем куки
    - web,     билд фронта и запуск сервера апи (localhost:3000)
    - handler, слушатель тасков, пока только в одном потоке
./screens      - скриншоты с ошибками

SaleTask {
    id       - ключ
    status   - (
        const STATE_QUEUE       = 0; в очереди
        const STATE_PROGRESS    = 1; в обработке
        const STATE_DONE        = 3; обработан без ошибок
        const STATE_ERROR       = 4; ошибка
    )
    entry    - ссылка на товар
    current  - сообщение о состоянии задачи
    at       - время оформления заказа
    atCart   - время добавления в корзину
}
```

![image](https://raw.githubusercontent.com/heid9001/ozon-sales-bot/master/sales-bot.png)
