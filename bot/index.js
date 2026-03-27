import { Bot } from "grammy";
import * as dotenv from "dotenv";
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

// Команда /start — показує кнопку для відкриття Mini App
bot.command("start", async (ctx) => {
    await ctx.reply(
        "👋 Привіт! Я RideUA — знайди попутника або запропонуй місце в авто.\n\nНатисни кнопку нижче щоб відкрити додаток:",
        {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "🚗 Відкрити RideUA",
                        web_app: { url: "https://example.com" } // поки заглушка, потім замінимо
                    }
                ]]
            }
        }
    );
});

bot.command("help", async (ctx) => {
    await ctx.reply("Команди:\n/start — запустити бота\n/help — допомога");
});

bot.start();
console.log("✅ Бот запущено!");