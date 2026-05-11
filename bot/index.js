import { Bot } from "grammy";
import * as dotenv from "dotenv";
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

// Команда /start — показує кнопку для відкриття Mini App
bot.command("start", async (ctx) => {
    const user = ctx.from

    // Перевіряємо чи є юзер в базі
    const { data: existing } = await supabase
        .from('users')
        .select('id, phone')
        .eq('id', user.id)
        .single()

    // Якщо новий юзер або немає телефону — просимо поділитись
    if (!existing || !existing.phone) {
        await supabase.from('users').upsert({
            id: user.id,
            name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
            username: user.username || null
        }, { onConflict: 'id' })

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
        // Вже є телефон — одразу показуємо кнопку
        await ctx.reply(
            "👋 З поверненням! Натисни щоб відкрити додаток:",
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚗 Відкрити RideUA", web_app: { url: process.env.WEBAPP_URL } }
                    ]]
                }
            }
        )
    }
})

// Обробляємо коли юзер поділився контактом
bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact
    const userId = ctx.from.id

    // Зберігаємо телефон (тільки якщо це власний контакт юзера)
    if (contact.user_id === userId) {
        await supabase.from('users').update({
            phone: contact.phone_number
        }).eq('id', userId)

        await ctx.reply(
            "✅ Дякуємо! Номер збережено.\n\nТепер відкривай додаток:",
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚗 Відкрити RideUA", web_app: { url: process.env.WEBAPP_URL } }
                    ]],
                    // Прибираємо клавіатуру з кнопкою контакту
                    remove_keyboard: true
                }
            }
        )
    }
})

bot.command("help", async (ctx) => {
    await ctx.reply("Команди:\n/start — запустити бота\n/help — допомога");
});

bot.start();
console.log("✅ Бот запущено!");