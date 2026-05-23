const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const express = require('express');
const app = express();

// Cổng giữ mạng cho Render 24/7
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Vexz Ultimate Spam Bot is Running!'));
app.listen(PORT, () => console.log(`💻 Web Server đang chạy trên port ${PORT}`));

const TOKEN = process.env.TOKEN;
const OWNER_ID = "1486380909736366120"; // ← THAY ID DISCORD CỦA ÔNG VÀO ĐÂY

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let spamInterval = null; // Vòng lặp gửi tin
let maxDurationTimeout = null; // Bộ đếm thời gian tự tắt

// CÀI ĐẶT TỐC ĐỘ CỐ ĐỊNH: 200ms = 1 giây xả 5 tin nhắn
const SPAM_SPEED_MS = 200; 

const slashCommands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('🚀 Kích hoạt dội bom chat tốc độ cao (1 giây 5 tin)')
        .addStringOption(o => o.setName('noi_dung').setDescription('Nhập nội dung chat mình muốn nói').setRequired(true))
        .addIntegerOption(o => o.setName('thoi_gian_chay').setDescription('Chọn thời gian spam (Tính bằng GIÂY). Tối thiểu 1s, tối đa 3600s (1 giờ)').setRequired(true)),
    new SlashCommandBuilder()
        .setName('spam-stop')
        .setDescription('🛑 Dừng trận spam ngay lập tức')
];

client.on('ready', async () => {
    console.log(`✅ Bot Spam VIP [${client.user.tag}] đã sẵn sàng xuất kích!`);
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    } catch (e) { console.error("Lỗi cập nhật lệnh:", e); }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, channel } = interaction;

    // Bảo mật: Chỉ chủ Bot mới có quyền chạy lệnh
    if (user.id !== OWNER_ID) {
        return interaction.reply({ content: "❌ Ông không có quyền sử dụng lệnh tối mật này!", ephemeral: true });
    }

    // ===== LỆNH /spam =====
    if (commandName === 'spam') {
        if (spamInterval) {
            return interaction.reply({ content: "⚠️ Bot đang bận xả một trận spam khác rồi! Dùng `/spam-stop` để dừng trước nha.", ephemeral: true });
        }

        const text = interaction.options.getString('noi_dung');
        let durationSec = interaction.options.getInteger('thoi_gian_chay');

        // 🛡️ KHỐNG CHẾ GIỚI HẠN THỜI GIAN CHẠY (ÍT NHẤT 1 GIÂY - TỐI ĐA 1 GIỜ)
        if (durationSec < 1) {
            return interaction.reply({ content: "❌ Thời gian chạy ít nhất phải là 1 giây chứ ông!", ephemeral: true });
        }
        if (durationSec > 3600) {
            return interaction.reply({ content: "❌ Thời gian chạy tối đa chỉ được 3600 giây (1 giờ) để bảo vệ bot!", ephemeral: true });
        }

        await interaction.reply({ 
            content: `🚀 Bắt đầu dội bom chat: **"${text}"**\n🔥 Tốc độ xả: 5 tin/giây\n⏱️ Tự động rút quân sau: **${durationSec} giây**!`, 
            ephemeral: true 
        });

        // Vòng lặp xả chat tốc độ bàn thờ
        spamInterval = setInterval(async () => {
            try {
                await channel.send(text);
            } catch (error) {
                console.log("⚠️ Vướng Rate Limit Discord, đang đẩy hàng đợi...");
            }
        }, SPAM_SPEED_MS);

        // Bộ đếm thời gian tự ngắt theo số giây ông chọn
        maxDurationTimeout = setTimeout(async () => {
            if (spamInterval) {
                clearInterval(spamInterval);
                spamInterval = null;
                try {
                    await channel.send(`⚠️ **[HỆ THỐNG AN TOÀN]** Đã hoàn thành thời gian chọn (**${durationSec} giây**). Bot tự động ngừng spam!`);
                } catch (e) { console.error(e); }
            }
        }, durationSec * 1000);
    }

    // ===== LỆNH /spam-stop =====
    if (commandName === 'spam-stop') {
        if (!spamInterval) {
            return interaction.reply({ content: "⚠️ Hiện tại bot có đang chạy trận spam nào đâu ông ơi!", ephemeral: true });
        }

        clearInterval(spamInterval);
        spamInterval = null;

        if (maxDurationTimeout) {
            clearTimeout(maxDurationTimeout);
            maxDurationTimeout = null;
        }

        await interaction.reply({ content: "🛑 Đã thu quân chủ động! Bot ngừng spam thành công.", ephemeral: true });
    }
});

client.login(TOKEN);
 
