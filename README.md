# Sniper API

Sniper-Bot с использованием Jupiter API, который исполняет сделки на Solana и ведёт их историю в SQLite.

## Как запустить
1. `npm install`
2. `cp .env.example .env` и заполните переменные (см. ниже)
3. `npm run dev`

## Переменные окружения
| Ключ | Назначение | Пример |
| --- | --- | --- |
| `SOLANA_RPC` | RPC-узел Solana, через который подписываются транзакции | `https://api.mainnet-beta.solana.com` |
| `PORT` | Порт HTTP-сервера | `5600` |
| `DB_PATH` | Путь к SQLite файлу | `./data/database.sqlite` |
| `SIGNER_PK` | Приватный ключ (base58) аккаунта, который будет исполнять сделки. Поле обязательно, иначе сервис не стартует | `base58_secret` |
| `INPUT_MINT_FOR_SIMPLE_MODE` | Mint «входного» токена для покупок. Используется как `inputMint` во всех свопах | `So11111111111111111111111111111111111111112` |

## HTTP-методы
Все ответы имеют вид `{ success: boolean, result?: any, error_description?: string }` и возвращаются в snake_case.

В заголовки запроса обязательно нужно добавлять авторизационный токен в формате `Bearer <token>`.
Пример: `Authorization: Bearer testX123`

### `POST /buy`
Создаёт сделку «buy». Тело: `{ user_id: number, token_mint: string, amount: string }`, где `amount` — количество входного токена в минимальных единицах (BN). Возвращает `{ trade_id, swap_result }`, где `swap_result` содержит order/execute ответы Jupiter.

### `POST /sell`
Фиксирует прибыль по ранее созданной покупке. Тело: `{ user_id: number, trade_id: number }`. Сервис повторно свопает токены (output → input mint) и записывает сделку `sell`. Возвращает `{ trade_id, swap_result }`, где `trade_id` — ID исходной покупки.

### `GET /pnl/:userId`
Сводит все сделки пользователя и возвращает объект с токенами: `{ token, name, symbol, bought, sold, pnl }` плюс поле `total_pnl`. Если открытая покупка ещё не продана, сервис подтягивает свежую цену через Jupiter `order` и считает нереализованный PnL.
Значения bought, sold, pnl и total_pnl возвращаются в валюте SOL.
