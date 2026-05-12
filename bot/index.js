import { Bot } from "grammy";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Зберігаємо в константу одразу після dotenv.config()
const WEBAPP_URL = process.env.WEBAPP_URL;
console.log('WEBAPP_URL:', WEBAPP_URL); // перевірка

// Команда /start — показує кнопку для відкриття Mini App
bot.command("start", async (ctx) => {
    const user = ctx.from

    try {
        // maybeSingle() повертає null замість помилки якщо не знайдено
        const { data: existing } = await supabase
            .from('users')
            .select('id, phone')
            .eq('id', user.id)
            .maybeSingle()

        // Завжди зберігаємо/оновлюємо базову інфу
        await supabase.from('users').upsert({
            id: user.id,
            name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
            username: user.username || null
        }, { onConflict: 'id' })

        if (!existing?.phone) {
            await ctx.reply(
                `👋 Привіт, ${user.first_name}!\n\nДля користування RideUA поділись своїм номером телефону — він буде видимий тільки водію після підтвердження поїздки.`,
                {
                    reply_markup: {
                        keyboard: [[
                            { text: "📱 Поділитись номером", request_contact: true }
                        ]],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            )
        } else {
            await ctx.reply(
                "👋 З поверненням! Натисни щоб відкрити додаток:",
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "🚗 Відкрити RideUA", web_app: { url: WEBAPP_URL } }
                        ]]
                    }
                }
            )
        }
    } catch (e) {
        console.error('Помилка /start:', e.message)
        await ctx.reply("Щось пішло не так, спробуй ще раз /start")
    }
})

// Обробляємо коли юзер поділився контактом
bot.on("message:contact", async (ctx) => {
    try {
        const contact = ctx.message.contact
        const userId = ctx.from.id

        if (contact.user_id === userId) {
            const { error } = await supabase
                .from('users')
                .update({ phone: contact.phone_number })
                .eq('id', userId)

            if (error) console.error('Помилка збереження телефону:', error.message)

            await ctx.reply("✅ Номер збережено!", {
                reply_markup: { remove_keyboard: true }
            })

            await ctx.reply("Тепер відкривай додаток 👇", {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚗 Відкрити RideUA", web_app: { url: WEBAPP_URL } }
                    ]]
                }
            })
        }
    } catch (e) {
        console.error('Помилка contact handler:', e.message)
        await ctx.reply("Номер збережено! Відкрий додаток через кнопку меню внизу 👇")
    }
})

bot.command("help", async (ctx) => {
    await ctx.reply("Команди:\n/start — запустити бота\n/help — допомога");
});

bot.catch((err) => {
    console.error('Bot error:', err.message)
})

bot.start();
console.log("✅ Бот запущено!");