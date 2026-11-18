require('dotenv').config();
const { Telegraf } = require('telegraf');

// ВСТАВЬТЕ СЮДА ВАШ ТОКЕН (в кавычках)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Хранилище питомцев для каждого пользователя
// В реальной игре нужна база данных, но для старта хватит и памяти
const pets = {};

// Функция для создания нового питомца
function createPet() {
    return {
        hunger: 100, // Сытость (100 = сыт, 0 = голоден)
        happiness: 100, // Настроение
        lastUpdated: Date.now() // Время последнего обновления
    };
}

// Функция для «старения» питомца (голод и грусть растут со временем)
function updatePet(pet) {
    const now = Date.now();
    const hoursPassed = (now - pet.lastUpdated) / (1000 * 60 * 60); // Сколько часов прошло
    
    if (hoursPassed > 0) {
        // Каждый час сытость и настроение падают на 5
        pet.hunger = Math.max(0, pet.hunger - Math.floor(hoursPassed * 5));
        pet.happiness = Math.max(0, pet.happiness - Math.floor(hoursPassed * 5));
        pet.lastUpdated = now;
    }
}

// Команда /start
bot.start((ctx) => {
    const userId = ctx.from.id;
    
    // Если питомца нет, создаём
    if (!pets[userId]) {
        pets[userId] = createPet();
    }
    
    ctx.reply(
        `Привет! Твой питомец ждёт тебя.\n\n` +
        `Команды:\n` +
        `/status - проверить состояние\n` +
        `/feed - покормить\n` +
        `/play - поиграть`
    );
});

// Команда /status
bot.command('status', (ctx) => {
    const userId = ctx.from.id;
    const pet = pets[userId];
    
    if (!pet) {
        return ctx.reply('Сначала напиши /start, чтобы завести питомца.');
    }
    
    updatePet(pet); // Обновляем состояние
    
    ctx.reply(
        `📊 Состояние питомца:\n\n` +
        `🍖 Сытость: ${pet.hunger}/100\n` +
        `😊 Настроение: ${pet.happiness}/100\n\n` +
        `${pet.hunger < 30 ? '⚠️ Питомец голоден!' : ''}\n` +
        `${pet.happiness < 30 ? '⚠️ Питомец грустит!' : ''}`
    );
});

// Команда /feed
bot.command('feed', (ctx) => {
    const userId = ctx.from.id;
    const pet = pets[userId];
    
    if (!pet) {
        return ctx.reply('Сначала напиши /start, чтобы завести питомца.');
    }
    
    updatePet(pet);
    
    // Кормим: +20 к сытости, но не больше 100
    pet.hunger = Math.min(100, pet.hunger + 20);
    
    ctx.reply(
        `🍽️ Ты покормил питомца!\n` +
        `Сытость: ${pet.hunger}/100`
    );
});

// Команда /play
bot.command('play', (ctx) => {
    const userId = ctx.from.id;
    const pet = pets[userId];
    
    if (!pet) {
        return ctx.reply('Сначала напиши /start, чтобы завести питомца.');
    }
    
    updatePet(pet);
    
    // Играем: +15 к настроению, но не больше 100
    pet.happiness = Math.min(100, pet.happiness + 15);
    
    ctx.reply(
        `🎾 Ты поиграл с питомцем!\n` +
        `Настроение: ${pet.happiness}/100`
    );
});

// Запуск бота
// bot.launch();
// console.log('Бот запущен!');

// Остановка при закрытии
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Удалите или закомментируйте исходный bot.launch() и код http-сервера
// bot.launch(); 

// Замените на конфигурацию Webhook
// Render автоматически предоставит переменную окружения RENDER_EXTERNAL_URL (это ваш публичный адрес)
// Если тестируете локально, можно временно не указывать или использовать инструмент типа ngrok
const webhookDomain = process.env.RENDER_EXTERNAL_URL; 

if (webhookDomain) {
    // Режим Webhook (работает на Render)
    bot.launch({
        webhook: {
            domain: webhookDomain,
            port: process.env.PORT || 3000, // Render выделит порт
        }
    }).then(() => {
        console.log(`Бот запущен в режиме Webhook: ${webhookDomain}`);
    });
} else {
    // Режим Long Polling (для локальной разработки)
    bot.launch().then(() => {
        console.log('Бот запущен в режиме Long Polling (локальная разработка)');
    });
}

// Код корректного завершения процесса оставьте без изменений
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));