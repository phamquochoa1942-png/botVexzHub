// =============================================
// DISCORD BÀI CÀO 3 LÁ + TÀI XỈU BOT - EMOJI THẬT
// Lệnh: .cao .bank .money .daily .taixiu .top .ruachen .admin | 24/7
// =============================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    token: process.env.TOKEN || "YOUR_BOT_TOKEN_HERE",
    prefix: ".",
    port: process.env.PORT || 3000,
    dataFile: path.join(__dirname, 'userdata.json'),
    ownerID: "1486380909736366120" // ID Admin/Owner
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ========== HTTP SERVER ==========
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(CONFIG.port);

// ========== BỘ BÀI EMOJI THẬT ==========
const boBai = [
    { id: "2_co", ten: "2 Cơ", emoji: "<:haitráitim:150821393621782758>", diem: 2 },
    { id: "3_co", ten: "3 Cơ", emoji: "<:batráitim:150821395588911295>", diem: 3 },
    { id: "4_bich", ten: "4 Bích", emoji: "<:bốnlábài:150821397476085840>", diem: 4 },
    { id: "5_bich", ten: "5 Bích", emoji: "<:nămlábài:150821400009707581>", diem: 5 },
    { id: "6_bich", ten: "6 Bích", emoji: "<:sáulábài:150821403281264670>", diem: 6 },
    { id: "7_chuon", ten: "7 Chuồn", emoji: "<:bảycâulạcbộ:150821405726539836>", diem: 7 },
    { id: "8_co", ten: "8 Cơ", emoji: "<:támcơ:150821408029216899>", diem: 8 },
    { id: "9_chuon", ten: "9 Chuồn", emoji: "<:chíncâulạcbộ:150821410130563193>", diem: 9 },
    { id: "10_co", ten: "10 Cơ", emoji: "<:tenofhearts:150821412336631889>", diem: 10 },
    { id: "J_chuon", ten: "J Chuồn", emoji: "<:jackofclubs1:150821414370869289>", diem: 10 },
    { id: "Q_co", ten: "Q Cơ", emoji: "<:nữhoàngcủatráitim:150821416501579826>", diem: 10 },
    { id: "K_chuon", ten: "K Chuồn", emoji: "<:vuacủacáccâulạcbộ:150821418586017892>", diem: 10 }
];

class CardGame {
    constructor() {
        this.deck = [];
        this.resetDeck();
    }

    resetDeck() {
        this.deck = [...boBai]; // Copy bộ bài
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            this.resetDeck();
        }
        return this.deck.pop();
    }

    drawHand(numCards) {
        return Array.from({ length: numCards }, () => this.drawCard());
    }
}

// ========== TÍNH ĐIỂM BÀI CÀO ==========
function calculateScore(cards) {
    let total = 0;
    
    for (let card of cards) {
        total += card.diem;
    }
    
    return total % 10;
}

function getScoreName(score) {
    const names = {
        0: '0 Điểm',
        1: '1 Điểm',
        2: '2 Điểm',
        3: '3 Điểm',
        4: '4 Điểm',
        5: '5 Điểm',
        6: '6 Điểm',
        7: '7 Điểm',
        8: '8 Điểm',
        9: '9 Điểm (Cào!)'
    };
    return names[score] || `${score} Điểm`;
}

function checkSpecial(cards) {
    const ids = cards.map(c => c.id.split('_')[0]); // Lấy phần số/J/Q/K
    const uniqueIds = new Set(ids);
    
    // Sáp (3 lá giống nhau)
    if (uniqueIds.size === 1) return 'SÁP 🔥';
    
    // 3 Tây (J, Q, K)
    if (ids.every(v => ['J', 'Q', 'K'].includes(v))) return '3 TÂY 👑';
    
    return null;
}

function getCardDisplay(card) {
    return card.emoji; // Trả về emoji thật
}

// ========== DATABASE TIỀN ẢO (TỰ ĐỘNG LƯU VÀO FILE) ==========
let userMoney = new Map();

function loadData() {
    try {
        if (fs.existsSync(CONFIG.dataFile)) {
            const rawData = fs.readFileSync(CONFIG.dataFile, 'utf8');
            const parsedData = JSON.parse(rawData);
            userMoney = new Map(Object.entries(parsedData));
            console.log(`✅ Đã tải dữ liệu ${userMoney.size} người dùng từ file!`);
        } else {
            console.log('📁 Chưa có file dữ liệu, tạo mới...');
            saveData();
        }
    } catch (error) {
        console.error('❌ Lỗi tải dữ liệu:', error.message);
        userMoney = new Map();
    }
}

function saveData() {
    try {
        const obj = Object.fromEntries(userMoney);
        fs.writeFileSync(CONFIG.dataFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Lỗi lưu dữ liệu:', error.message);
    }
}

setInterval(() => {
    if (userMoney.size > 0) {
        saveData();
        console.log(`💾 Đã tự động lưu ${userMoney.size} người dùng`);
    }
}, 30000);

process.on('SIGINT', () => {
    console.log('🔄 Đang lưu dữ liệu trước khi tắt...');
    saveData();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🔄 Đang lưu dữ liệu trước khi tắt...');
    saveData();
    process.exit(0);
});

function getMoney(userId) {
    if (!userMoney.has(userId)) {
        userMoney.set(userId, 10000);
        saveData();
        console.log(`🆕 Người dùng mới: ${userId} - Tặng 10,000 VNĐ`);
    }
    return userMoney.get(userId);
}

function addMoney(userId, amount) {
    const current = getMoney(userId);
    userMoney.set(userId, current + amount);
    saveData();
}

function deductMoney(userId, amount) {
    const current = getMoney(userId);
    if (current < amount) return false;
    userMoney.set(userId, current - amount);
    saveData();
    return true;
}

// ========== DAILY COOLDOWN (1h30p = 5400000ms) ==========
const dailyCooldown = new Map();

function canUseDaily(userId) {
    const now = Date.now();
    const lastUsed = dailyCooldown.get(userId) || 0;
    const cooldownTime = 5400000; // 1 giờ 30 phút
    if (now - lastUsed < cooldownTime) {
        const remaining = cooldownTime - (now - lastUsed);
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return { canUse: false, timeStr: `${hours}h ${minutes}m ${seconds}s` };
    }
    return { canUse: true };
}

// ========== RỬA CHÉN COOLDOWN (45s = 45000ms) ==========
const ruaChenCooldown = new Map();

function canUseRuaChen(userId) {
    const now = Date.now();
    const lastUsed = ruaChenCooldown.get(userId) || 0;
    const cooldownTime = 45000; // 45 giây
    if (now - lastUsed < cooldownTime) {
        const remaining = cooldownTime - (now - lastUsed);
        const seconds = Math.floor(remaining / 1000);
        return { canUse: false, timeStr: `${seconds}s` };
    }
    return { canUse: true };
}

// ========== TÀI XỈU GAME ==========
const activeTaiXiuGames = new Map();

// ========== BOT EVENTS ==========
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} - Bot Bài Cào + Tài Xỉu Online!`);
    loadData();
    client.user.setPresence({ activities: [{ name: '.cao .taixiu .ruachen .bank | 24/7', type: 'PLAYING' }], status: 'online' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = message.content.trim().toLowerCase();

    // ========== HELP ==========
    if (content === '.help') {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🃏 Bot Bài Cào + Tài Xỉu - Hướng Dẫn')
            .setDescription('Chơi bài cào và tài xỉu với bot!')
            .addFields(
                { name: '🎮 Lệnh chơi', value: '`.cao <tiền_cược>` - Chơi bài cào\n`.taixiu` - Mở bàn tài xỉu (có nút bấm)\n`.ruachen` - Rửa chén kiếm 1,000 VNĐ (45s)' },
                { name: '💰 Lệnh tiền', value: '`.money` - Xem tiền\n`.daily` - Nhận 5k (1h30p dùng 1 lần)\n`.bank <@user> <số_tiền>` - Chuyển tiền\n`.top` - Xem top giàu' },
                { name: '👑 Admin', value: '`.admin` - Admin nhận 500,000 VNĐ (chỉ Owner)' },
                { name: '📋 Luật Tài Xỉu', value: 'Xỉu: 3-10 | Tài: 11-18\n45 giây để đặt cược\nCó thể chọn 1 trong 2 hoặc cả 2' },
                { name: '💾 Lưu dữ liệu', value: '✅ Tiền tự động lưu vào file\n✅ Không sợ mất khi bot restart' }
            );
        return message.reply({ embeds: [embed] });
    }

    // ========== XEM TIỀN ==========
    if (content === '.money') {
        const money = getMoney(message.author.id);
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`💰 ${message.author.username}`)
            .setDescription(`Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
        return message.reply({ embeds: [embed] });
    }

    // ========== TOP GIÀU ==========
    if (content === '.top') {
        const sorted = [...userMoney.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        let ranking = '';
        for (let i = 0; i < sorted.length; i++) {
            const [userId, money] = sorted[i];
            const user = await client.users.fetch(userId).catch(() => null);
            const name = user ? user.username : 'Unknown';
            ranking += `**${i + 1}.** ${name} - 💰 ${money.toLocaleString('vi-VN')} VNĐ\n`;
        }
        
        if (!ranking) ranking = 'Chưa có ai chơi!';
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Top 10 Người Chơi Giàu Nhất')
            .setDescription(ranking)
            .setFooter({ text: `Tổng người chơi: ${userMoney.size}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== DAILY (1h30p cooldown) ==========
    if (content === '.daily') {
        const check = canUseDaily(message.author.id);
        
        if (!check.canUse) {
            return message.reply(`⏰ Bạn đã nhận daily rồi! Hãy đợi **${check.timeStr}** nữa để nhận tiếp.`);
        }
        
        dailyCooldown.set(message.author.id, Date.now());
        addMoney(message.author.id, 5000);
        const money = getMoney(message.author.id);
        
        return message.reply(`🎁 Nhận **5,000 VNĐ** thành công!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**\n⏰ Lần sau: **1h30p** nữa`);
    }

    // ========== RỬA CHÉN (45s cooldown = 1000 VNĐ) ==========
    if (content === '.ruachen') {
        const check = canUseRuaChen(message.author.id);
        
        if (!check.canUse) {
            return message.reply(`🍽️ Bạn đã rửa chén rồi! Hãy đợi **${check.timeStr}** nữa để rửa tiếp.`);
        }
        
        ruaChenCooldown.set(message.author.id, Date.now());
        addMoney(message.author.id, 1000);
        const money = getMoney(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#00CCFF')
            .setTitle('🍽️ Rửa Chén Thành Công!')
            .setDescription(`${message.author} đã rửa chén và nhận **1,000 VNĐ**!`)
            .addFields(
                { name: '💰 Số dư mới', value: `**${money.toLocaleString('vi-VN')} VNĐ**` },
                { name: '⏰ Lần sau', value: '**45 giây** nữa' }
            )
            .setFooter({ text: 'Chăm chỉ rửa chén để giàu nào! 🧽' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== ADMIN (Chỉ Owner - Nhận 500,000 VNĐ) ==========
    if (content === '.admin') {
        if (message.author.id !== CONFIG.ownerID) {
            return message.reply('❌ **Bạn không có quyền dùng lệnh này!**\nChỉ Owner mới được dùng lệnh `.admin`');
        }
        
        addMoney(message.author.id, 500000);
        const money = getMoney(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor('#FF00FF')
            .setTitle('👑 Admin Nhận Tiền!')
            .setDescription(`${message.author} đã nhận **500,000 VNĐ** từ ngân sách!`)
            .addFields(
                { name: '💰 Số dư mới', value: `**${money.toLocaleString('vi-VN')} VNĐ**` }
            )
            .setFooter({ text: '👑 Admin Panel | Chỉ Owner được dùng' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== BANK (CHUYỂN TIỀN) ==========
    if (content.startsWith('.bank')) {
        const args = message.content.split(' ');
        args.shift();
        
        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Vui lòng **tag người nhận**!\n`.bank @user <số_tiền>`');
        }
        
        if (targetUser.id === message.author.id) {
            return message.reply('❌ Không thể chuyển tiền cho chính mình!');
        }
        
        if (targetUser.bot) {
            return message.reply('❌ Không thể chuyển tiền cho bot!');
        }
        
        const mentionIndex = args.findIndex(a => a.includes(targetUser.id));
        if (mentionIndex !== -1) args.splice(mentionIndex, 1);
        
        const amount = parseInt(args[0]);
        
        if (isNaN(amount) || amount < 100) {
            return message.reply('❌ Số tiền chuyển tối thiểu **100 VNĐ**!\n`.bank @user <số_tiền>`');
        }
        
        if (!deductMoney(message.author.id, amount)) {
            const currentMoney = getMoney(message.author.id);
            return message.reply(`❌ Không đủ tiền!\n💰 Số dư của bạn: **${currentMoney.toLocaleString('vi-VN')} VNĐ**\n💸 Cần chuyển: **${amount.toLocaleString('vi-VN')} VNĐ**`);
        }
        
        addMoney(targetUser.id, amount);
        
        const senderMoney = getMoney(message.author.id);
        const receiverMoney = getMoney(targetUser.id);
        
        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🏦 Chuyển Tiền Thành Công!')
            .setDescription(`${message.author} ──💸 **${amount.toLocaleString('vi-VN')} VNĐ**──> ${targetUser}`)
            .addFields(
                { name: `💰 ${message.author.username}`, value: `Còn: **${senderMoney.toLocaleString('vi-VN')} VNĐ**`, inline: true },
                { name: `💰 ${targetUser.username}`, value: `Có: **${receiverMoney.toLocaleString('vi-VN')} VNĐ**`, inline: true }
            )
            .setFooter({ text: '🏦 Ngân hàng Bot Bài Cào | Tự động lưu' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== CHƠI BÀI CÀO ==========
    if (content.startsWith('.cao')) {
        const args = message.content.split(' ');
        const bet = parseInt(args[1]);

        if (isNaN(bet) || bet < 100) {
            return message.reply('❌ Cược tối thiểu **100 VNĐ**!\n`.cao <số_tiền>`');
        }

        if (!deductMoney(message.author.id, bet)) {
            return message.reply('❌ Không đủ tiền!\n💰 Dùng `.daily` để nhận thêm');
        }

        const game = new CardGame();
        const playerCards = game.drawHand(3);
        const botCards = game.drawHand(3);

        const playerScore = calculateScore(playerCards);
        const botScore = calculateScore(botCards);
        const playerSpecial = checkSpecial(playerCards);
        const botSpecial = checkSpecial(botCards);

        const playerDisplay = playerCards.map(c => getCardDisplay(c)).join(' ');
        const botDisplay = botCards.map(c => getCardDisplay(c)).join(' ');

        let result = '';
        let color = '';
        let winAmount = 0;

        if (playerSpecial && !botSpecial) {
            result = 'THẮNG';
            color = '#FFD700';
            winAmount = bet * 3;
        } else if (!playerSpecial && botSpecial) {
            result = 'THUA';
            color = '#FF0000';
            winAmount = 0;
        } else if (playerSpecial && botSpecial) {
            if (playerSpecial === botSpecial) {
                result = 'HÒA';
                color = '#FFFF00';
                winAmount = bet;
            } else {
                result = playerScore > botScore ? 'THẮNG' : 'THUA';
                color = result === 'THẮNG' ? '#FFD700' : '#FF0000';
                winAmount = result === 'THẮNG' ? bet * 2 : 0;
            }
        } else {
            if (playerScore > botScore) {
                result = 'THẮNG';
                color = '#FFD700';
                winAmount = bet * 2;
            } else if (playerScore < botScore) {
                result = 'THUA';
                color = '#FF0000';
                winAmount = 0;
            } else {
                result = 'HÒA';
                color = '#FFFF00';
                winAmount = bet;
            }
        }

        addMoney(message.author.id, winAmount);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`🃏 Bài Cào - ${result}!`)
            .setDescription(`Cược: **${bet.toLocaleString('vi-VN')} VNĐ**`)
            .addFields(
                { name: `👤 ${message.author.username}`, value: `${playerDisplay}\n${playerSpecial ? `**${playerSpecial}** + ` : ''}${getScoreName(playerScore)}`, inline: true },
                { name: `🤖 Bot`, value: `${botDisplay}\n${botSpecial ? `**${botSpecial}** + ` : ''}${getScoreName(botScore)}`, inline: true },
                { name: '💰 Kết quả', value: winAmount > 0 ? `+ **${winAmount.toLocaleString('vi-VN')} VNĐ**` : 'Mất cược', inline: false }
            )
            .setFooter({ text: `Số dư: ${getMoney(message.author.id).toLocaleString('vi-VN')} VNĐ | Tự động lưu 💾` });

        return message.reply({ embeds: [embed] });
    }

    // ========== TÀI XỈU ==========
    if (content === '.taixiu') {
        if (activeTaiXiuGames.has(message.channel.id)) {
            return message.reply('❌ Đã có bàn tài xỉu đang chạy trong kênh này! Đợi kết thúc nhé.');
        }

        const betAmount = 100;
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('tx_tai')
                    .setLabel('TÀI (11-18)')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔴'),
                new ButtonBuilder()
                    .setCustomId('tx_xiu')
                    .setLabel('XỈU (3-10)')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔵')
            );

        const embed = new EmbedBuilder()
            .setColor('#FF6600')
            .setTitle('🎲 BÀN TÀI XỈU')
            .setDescription(
                '**Đặt cược: 100 VNĐ**\n\n' +
                '🔴 **TÀI**: 11-18 (x2 tiền)\n' +
                '🔵 **XỈU**: 3-10 (x2 tiền)\n\n' +
                '⏰ **45 giây** để đặt cược!\n' +
                '👤 Người chơi tham gia bấm nút bên dưới'
            )
            .setFooter({ text: 'Bấm nút để đặt cược | Có thể chọn cả 2!' })
            .setTimestamp();

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const gameData = {
            messageId: gameMessage.id,
            channelId: message.channel.id,
            taiPlayers: new Set(),
            xiuPlayers: new Set(),
            bets: new Map(),
            startTime: Date.now(),
            timeLeft: 45
        };

        activeTaiXiuGames.set(message.channel.id, gameData);

        const countdownInterval = setInterval(async () => {
            const game = activeTaiXiuGames.get(message.channel.id);
            if (!game) {
                clearInterval(countdownInterval);
                return;
            }

            game.timeLeft--;

            const updatedEmbed = EmbedBuilder.from(embed)
                .setDescription(
                    '**Đặt cược: 100 VNĐ**\n\n' +
                    '🔴 **TÀI**: 11-18 (x2)\n' +
                    '🔵 **XỈU**: 3-10 (x2)\n\n' +
                    `⏰ Còn **${game.timeLeft} giây** để đặt cược!\n` +
                    `👤 Tài: **${game.taiPlayers.size}** người | Xỉu: **${game.xiuPlayers.size}** người`
                );

            try {
                await gameMessage.edit({ embeds: [updatedEmbed], components: [row] });
            } catch {}

            if (game.timeLeft <= 0) {
                clearInterval(countdownInterval);
                await shakeTaiXiu(gameMessage, game, row);
            }
        }, 1000);
    }
});

// ========== XỬ LÝ BUTTON TÀI XỈU ==========
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const game = activeTaiXiuGames.get(interaction.channelId);
    if (!game) return;

    if (interaction.customId === 'tx_tai' || interaction.customId === 'tx_xiu') {
        await interaction.deferUpdate();
        
        const userId = interaction.user.id;
        
        const money = getMoney(userId);
        if (money < 100) {
            return interaction.followUp({ content: `❌ ${interaction.user} không đủ tiền! Cần 100 VNĐ`, ephemeral: true });
        }

        if (interaction.customId === 'tx_tai') {
            if (game.taiPlayers.has(userId)) {
                return interaction.followUp({ content: `❌ ${interaction.user} bạn đã đặt TÀI rồi!`, ephemeral: true });
            }
            game.taiPlayers.add(userId);
            game.bets.set(userId, 'tai');
        }
        
        if (interaction.customId === 'tx_xiu') {
            if (game.xiuPlayers.has(userId)) {
                return interaction.followUp({ content: `❌ ${interaction.user} bạn đã đặt XỈU rồi!`, ephemeral: true });
            }
            game.xiuPlayers.add(userId);
            if (game.bets.has(userId)) {
                game.bets.set(userId, 'both');
            } else {
                game.bets.set(userId, 'xiu');
            }
        }

        interaction.followUp({ content: `✅ ${interaction.user} đã đặt cược!`, ephemeral: true });
    }
});

// ========== HÀM LẮC TÀI XỈU ==========
async function shakeTaiXiu(gameMessage, game, row) {
    const channel = gameMessage.channel;
    
    const disabledRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('tx_tai_end')
                .setLabel('TÀI (11-18)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('tx_xiu_end')
                .setLabel('XỈU (3-10)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );

    const shakeEmojis = ['🎲', '🎯', '🎰', '🎪', '🎡'];
    const shakeTexts = [
        '🎲 ĐANG LẮC...',
        '🎯 ĐANG LẮC...',
        '🎰 SẮP CÓ KẾT QUẢ...',
        '🎪 CHUẨN BỊ MỞ...',
        '🎡 MỞ...'
    ];

    for (let i = 0; i < 5; i++) {
        const shakeEmbed = new EmbedBuilder()
            .setColor('#FF6600')
            .setTitle(shakeTexts[i])
            .setDescription(
                `\`\`\`\n` +
                `  ┌─────┐\n` +
                `  │  ${shakeEmojis[i]}  │\n` +
                `  └─────┘\n` +
                `\`\`\``
            );

        await gameMessage.edit({ embeds: [shakeEmbed], components: [disabledRow] });
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const dice3 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2 + dice3;
    const result = total >= 11 ? 'tai' : 'xiu';

    const diceEmojis = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

    let resultsText = '';
    for (const [userId, bet] of game.bets) {
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) continue;
        
        let win = false;
        if (bet === 'both') {
            win = true;
        } else if (bet === result) {
            win = true;
        }
        
        if (win) {
            if (bet === 'both') {
                addMoney(userId, 100);
                resultsText += `✅ ${user.username}: Hoàn cược (đặt cả 2)\n`;
            } else {
                addMoney(userId, 200);
                resultsText += `✅ ${user.username}: +200 VNĐ\n`;
            }
        } else {
            deductMoney(userId, 100);
            resultsText += `❌ ${user.username}: -100 VNĐ\n`;
        }
    }

    if (!resultsText) resultsText = 'Không có ai tham gia!';

    const resultEmbed = new EmbedBuilder()
        .setColor(result === 'tai' ? '#FF0000' : '#0066FF')
        .setTitle(result === 'tai' ? '🔴 KẾT QUẢ: TÀI!' : '🔵 KẾT QUẢ: XỈU!')
        .setDescription(
            `\`\`\`\n` +
            `  ┌───┬───┬───┐\n` +
            `  │ ${diceEmojis[dice1]} │ ${diceEmojis[dice2]} │ ${diceEmojis[dice3]} │\n` +
            `  ├───┼───┼───┤\n` +
            `  │ ${dice1}  │ ${dice2}  │ ${dice3}  │\n` +
            `  └───┴───┴───┘\n` +
            `     TỔNG: ${total}\n` +
            `\`\`\``
        )
        .addFields({ name: '📊 Kết quả người chơi', value: resultsText || 'Không có ai' })
        .setFooter({ text: 'Tài Xỉu Bot | Dùng .taixiu để chơi tiếp' })
        .setTimestamp();

    await gameMessage.edit({ embeds: [resultEmbed], components: [disabledRow] });

    activeTaiXiuGames.delete(game.channelId);
}

// ========== LOGIN ==========
client.login(CONFIG.token).then(() => {
    console.log('🃏 Bot Bài Cào + Tài Xỉu đã sẵn sàng!');
    console.log('📋 Lệnh: .cao .taixiu .ruachen .money .daily .bank .admin .top .help');
    console.log('💾 Tự động lưu tiền vào file userdata.json');
    console.log('⏰ Daily cooldown: 1h30p');
    console.log('🍽️ Rửa chén cooldown: 45s (+1,000 VNĐ)');
    console.log('👑 Admin: .admin (+500,000 VNĐ) chỉ Owner');
    console.log('🎲 Tài Xỉu: 45s đặt cược + hiệu ứng lắc');
    console.log('🃏 Bài Cào: Dùng emoji bài thật!');
}).catch(console.error); 
