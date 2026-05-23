const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const express = require('express');

// --- CẤU HÌNH WEB SERVER ĐỂ TREO TRÊN RENDER 24/7 ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Bot đang chạy online 24/7!');
});

app.listen(PORT, () => {
    console.log(`💻 Web Server đang chạy trên port ${PORT}`);
});

// --- CẤU HÌNH DISCORD BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Biến toàn cục để lưu bộ đếm thời gian spam
let spamIntervals = {};

// --- ĐĂNG KÝ LỆNH GẠCH CHÉO (SLASH COMMANDS) ---
const commands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Kích nổ spam tin nhắn')
        .addStringOption(option => 
            option.setName('noidung')
                .setDescription('Nhập nội dung muốn spam')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('thoigian')
                .setDescription('Chọn thời gian giãn cách giữa các tin nhắn')
                .setRequired(false)
                // Tạo menu lựa chọn từ 1 giây đến 1 giờ
                .addChoices(
                    { name: '1 giây', value: 1000 },
                    { name: '3 giây', value: 3000 },
                    { name: '5 giây', value: 5000 },
                    { name: '10 giây', value: 10000 },
                    { name: '30 giây', value: 30000 },
                    { name: '1 phút', value: 60000 },
                    { name: '5 phút', value: 300000 },
                    { name: '10 phút', value: 600000 },
                    { name: '30 phút', value: 1800000 },
                    { name: '1 giờ', value: 3600000 }
                ))
        .setIntegrationTypes([0, 1]) // Đi theo tài khoản qua server khác
        .setContexts([0, 1, 2]),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Dừng spam khẩn cấp')
        .setIntegrationTypes([0, 1])
        .setContexts([0, 1, 2])
];

// --- GỬI LỆNH LÊN DISCORD APIS ---
client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} đã sẵn sàng xuất kích!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('🔄 Đang cập nhật hệ thống lệnh gạch chéo toàn cầu...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('🚀 Đã cập nhật xong lệnh toàn cầu (User App)!');
    } catch (error) {
        console.error('❌ Lỗi khi đăng ký lệnh:', error);
    }
});

// --- XỬ LÝ KHI NGƯỜI DÙNG GÕ LỆNH ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, user } = interaction;
    const idKey = guildId || user.id;

    // 1. XỬ LÝ LỆNH /SPAM
    if (commandName === 'spam') {
        const noidung = interaction.options.getString('noidung');
        // Nếu không chọn thời gian, mặc định sẽ là 1 giây (1000ms)
        const thoigian = interaction.options.getInteger('thoigian') || 1000; 

        // Đổi mili-giây sang chữ để bot thông báo cho đẹp
        let textHienThi = `${thoigian / 1000} giây`;
        if (thoigian >= 60000 && thoigian < 3600000) textHienThi = `${thoigian / 60000} phút`;
        if (thoigian >= 3600000) textHienThi = `${thoigian / 3600000} giờ`;

        // Nếu đang spam sẵn rồi thì ép dừng cái cũ
        if (spamIntervals[idKey]) {
            clearInterval(spamIntervals[idKey]);
        }

        await interaction.reply(`🚀 Bắt đầu xả trận spam! Giãn cách: **${textHienThi}**. Gõ \`/stop\` để dừng.`);

        // Kích hoạt vòng lặp spam
        spamIntervals[idKey] = setInterval(async () => {
            try {
                await interaction.channel.send(noidung);
            } catch (err) {
                console.log('❌ Bị chặn gửi tin nhắn hoặc thiếu quyền.');
                clearInterval(spamIntervals[idKey]);
                delete spamIntervals[idKey];
            }
        }, thoigian);
    }

    // 2. XỬ LÝ LỆNH /STOP
    if (commandName === 'stop') {
        if (spamIntervals[idKey]) {
            clearInterval(spamIntervals[idKey]); // Dừng bộ đếm ngay lập tức
            delete spamIntervals[idKey];
            return interaction.reply('✅ Đã dập dịch! Bot đã dừng spam thành công.');
        } else {
            return interaction.reply('❌ Hiện tại bot có đang spam cái gì đâu mà dừng ông?');
        }
    }
});

// Đăng nhập bot
client.login(process.env.TOKEN);
 
