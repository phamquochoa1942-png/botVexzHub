const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const express = require('express');
const app = express();

// Cổng giữ mạng cho Render 24/7
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Vexz Ultimate Ghost Bot is Running!'));
app.listen(PORT, () => console.log(`💻 Web Server đang chạy trên port ${PORT}`));

const TOKEN = process.env.TOKEN;
const OWNER_ID = "1486380909736366120"; // ← THAY ID DISCORD CỦA ÔNG VÀO ĐÂY

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let spamInterval = null; // Vòng lặp gửi tin
let maxDurationTimeout = null; // Bộ đếm thời gian tự tắt

// TỐC ĐỘ CỐ ĐỊNH: 200ms = 1 giây xả đúng 5 tin nhắn
const SPAM_SPEED_MS = 200; 

// CẤU HÌNH CÁC LỆNH ĐĂNG KÝ VỚI DISCORD
const slashCommands = [
    // Lệnh kích hoạt spam
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('🚀 Kích hoạt dội bom chat tốc độ cao (Ẩn danh người dùng)')
        .addStringOption(o => o.setName('noi_dung').setDescription('Nhập nội dung chat mình muốn nói').setRequired(true))
        .addIntegerOption(o => o.setName('thoi_gian_chay').setDescription('Chọn thời gian spam (Tính bằng GIÂY). Tối thiểu 1s, tối đa 3600s').setRequired(true))
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),
    
    // Lệnh dừng ngắn gọn (MỚI)
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('🛑 Dừng trận spam ngay lập tức (Ẩn danh)')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2]),

    // Giữ lại lệnh stop cũ phòng hờ ông quen tay gõ
    new SlashCommandBuilder()
        .setName('spam-stop')
        .setDescription('🛑 Dừng trận spam ngay lập tức (Ẩn danh)')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
];

client.on('ready', async () => {
    console.log(`✅ Bot Toàn Cầu VIP [${client.user.tag}] đã sẵn sàng xuất kích!`);
    try {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
        console.log("🔥 Đã đồng bộ hệ thống lệnh ẩn danh thích ứng mọi Server!");
    } catch (e) { console.error("Lỗi cập nhật lệnh:", e); }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName, user, channel } = interaction;

    // Bảo mật: Chỉ chủ Bot mới có quyền chạy lệnh
    if (user.id !== OWNER_ID) {
        return interaction.reply({ content: "❌ Ông không có quyền sử dụng lệnh tối mật này!", ephemeral: true });
    }

    // ===== HÀNH VI LỆNH /spam =====
    if (commandName === 'spam') {
        if (spamInterval) {
            return interaction.reply({ content: "⚠️ Bot đang bận xả một trận spam khác rồi! Dùng `/stop` trước nha.", ephemeral: true });
        }

        const text = interaction.options.getString('noi_dung');
        let durationSec = interaction.options.getInteger('thoi_gian_chay');

        // Khống chế giới hạn thời gian chạy (1 giây -> 1 giờ)
        if (durationSec < 1 || durationSec > 3600) {
            return interaction.reply({ content: "❌ Thời gian chạy chỉ được phép trong khoảng từ 1 đến 3600 giây!", ephemeral: true });
        }

        // Bật ẩn danh: Chỉ ông nhìn thấy thông báo này
        await interaction.reply({ 
            content: `🕵️ **[CHẾ ĐỘ ẨN DANH]** Đã kích hoạt dội bom chat thành công!\n📝 Nội dung: **"${text}"**\n⏱️ Thời gian: **${durationSec} giây**.\n*(Mọi dấu vết dùng lệnh đã được ẩn giấu hoàn toàn)*`, 
            ephemeral: true 
        });

        // Vòng lặp xả chat tốc độ 1 giây 5 tin
        spamInterval = setInterval(async () => {
            try {
                await channel.send(text);
            } catch (error) {
                console.log("⚠️ Vướng Rate Limit hoặc thiếu quyền gửi tin...");
            }
        }, SPAM_SPEED_MS);

        // Bộ đếm giờ tự tắt an toàn
        maxDurationTimeout = setTimeout(async () => {
            if (spamInterval) {
                clearInterval(spamInterval);
                spamInterval = null;
                console.log("🛑 Đã hoàn thành thời gian chạy. Tự động ngắt spam trong im lặng.");
            }
        }, durationSec * 1000);
    }

    // ===== HÀNH VI LỆNH /stop HOẶC /spam-stop =====
    if (commandName === 'stop' || commandName === 'spam-stop') {
        if (!spamInterval) {
            return interaction.reply({ content: "⚠️ Hiện tại bot có đang chạy trận spam nào đâu ông ơi!", ephemeral: true });
        }

        // Xóa vòng lặp spam
        clearInterval(spamInterval);
        spamInterval = null;

        // Xóa bộ đếm thời gian ngược
        if (maxDurationTimeout) {
            clearTimeout(maxDurationTimeout);
            maxDurationTimeout = null;
        }

        // Lệnh dừng cũng được ẩn danh chỉ mình ông thấy
        await interaction.reply({ content: "🛑 Đã thu quân chủ động! Bot ngừng spam thành công.", ephemeral: true });
    }
});

client.on('error', console.error);

client.login(TOKEN);
 
