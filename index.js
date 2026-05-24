// =============================================
// DISCORD BÀI CÀO 3 LÁ + TÀI XỈU BOT - FULL
// Lệnh: .cao .bank .money .daily .taixiu .top .ruachen .cauca .cuop .xoso .admin | 24/7
// Có thách đấu 1v1 (cược chênh lệch) + đánh với bot
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

// ========== BỘ BÀI APPLICATION EMOJIS (TÊN KHÔNG DẤU) ==========
const boBai = [
    { id: "2_co", ten: "haitraitim", emojiId: "1508021393621782758", diem: 2 },
    { id: "3_co", ten: "batraitim", emojiId: "1508021395588911295", diem: 3 },
    { id: "4_bich", ten: "bonlabai", emojiId: "1508021397476085840", diem: 4 },
    { id: "5_bich", ten: "namlabai", emojiId: "1508021400009707581", diem: 5 },
    { id: "6_bich", ten: "saulabai", emojiId: "1508021403281264670", diem: 6 },
    { id: "7_chuon", ten: "baycaulacbo", emojiId: "1508021405726539836", diem: 7 },
    { id: "8_co", ten: "tamco", emojiId: "1508021408029216899", diem: 8 },
    { id: "9_chuon", ten: "chincaulacbo", emojiId: "1508021410130563193", diem: 9 },
    { id: "10_co", ten: "tenofhearts", emojiId: "1508021412336631889", diem: 10 },
    { id: "J_chuon", ten: "jackofclubs1", emojiId: "1508021414370869289", diem: 10 },
    { id: "Q_co", ten: "nuhoangcuatraitim", emojiId: "1508021416501579826", diem: 10 },
    { id: "K_chuon", ten: "vuacuacaccaulacbo", emojiId: "1508021418586017892", diem: 10 }
];

class CardGame {
    constructor() {
        this.deck = [];
        this.resetDeck();
    }

    resetDeck() {
        this.deck = [...boBai];
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
    const ids = cards.map(c => c.id.split('_')[0]);
    const uniqueIds = new Set(ids);
    
    if (uniqueIds.size === 1) return 'SÁP 🔥';
    
    if (ids.every(v => ['J', 'Q', 'K'].includes(v))) return '3 TÂY 👑';
    
    return null;
}

function getCardDisplay(card) {
    return `<:${card.ten}:${card.emojiId}>`;
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
    const cooldownTime = 5400000;
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
    const cooldownTime = 45000;
    if (now - lastUsed < cooldownTime) {
        const remaining = cooldownTime - (now - lastUsed);
        const seconds = Math.floor(remaining / 1000);
        return { canUse: false, timeStr: `${seconds}s` };
    }
    return { canUse: true };
}

// ========== CÂU CÁ COOLDOWN (1 phút) ==========
const fishCooldown = new Map();
const fishDatabase = [
    { name: '🐟 Cá Nhỏ', value: 50, chance: 0.4 },
    { name: '🐠 Cá Vàng', value: 200, chance: 0.3 },
    { name: '🐡 Cá Nóc', value: 500, chance: 0.15 },
    { name: '🦈 Cá Mập', value: 2000, chance: 0.1 },
    { name: '🐳 Cá Voi', value: 10000, chance: 0.04 },
    { name: '🐉 Rồng Biển', value: 50000, chance: 0.01 }
];

// ========== ĐI CƯỚP COOLDOWN (10 phút) ==========
const crimeCooldown = new Map();
const jailUsers = new Map();

// ========== XỔ SỐ ==========
const xosoTickets = [];
let xosoResult = null;
let xosoTimeout = null;

// ========== TÀI XỈU GAME ==========
const activeTaiXiuGames = new Map();

// ========== THÁCH ĐẤU 1V1 ==========
const challenges = new Map();

// ========== BOT EVENTS ==========
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} - Bot Bài Cào + Tài Xỉu Online!`);
    loadData();
    client.user.setPresence({ activities: [{ name: '.cao .taixiu .cauca .cuop .xoso | 24/7', type: 'PLAYING' }], status: 'online' });
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
                { name: '🎮 Lệnh chơi', value: '`.cao <tiền>` - Chơi bài cào với bot\n`.cao @nguoi <tiền>` - Thách đấu 1v1 (cược chênh lệch được)\n`.taixiu <tiền>` - Mở bàn tài xỉu\n`.xoso` - Mua vé xổ số 10k (5p quay)' },
                { name: '💼 Việc làm', value: '`.ruachen` - Rửa chén +1k (45s)\n`.cauca` - Câu cá +50~50k (1 phút)\n`.cuop` - Đi cướp (10 phút)' },
                { name: '💰 Lệnh tiền', value: '`.money` - Xem tiền\n`.daily` - Nhận 5k (1h30p)\n`.bank @user <tiền>` - Chuyển tiền\n`.top` - Xem top giàu' },
                { name: '👑 Admin', value: '`.admin` - Admin nhận 500,000 VNĐ (chỉ Owner)' },
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

    // ========== CÂU CÁ (1 phút cooldown) ==========
    if (content === '.cauca') {
        const userId = message.author.id;
        const now = Date.now();
        const cooldownTime = 60000;
        
        if (fishCooldown.has(userId)) {
            const remaining = cooldownTime - (now - fishCooldown.get(userId));
            if (remaining > 0) {
                const seconds = Math.floor(remaining / 1000);
                return message.reply(`⏰ Bạn vừa câu cá rồi! Hãy đợi **${seconds} giây** nữa!`);
            }
        }
        
        const roll = Math.random();
        let caught = fishDatabase[0];
        let cumulative = 0;
        
        for (let fish of fishDatabase) {
            cumulative += fish.chance;
            if (roll <= cumulative) {
                caught = fish;
                break;
            }
        }
        
        fishCooldown.set(userId, now);
        addMoney(userId, caught.value);
        const money = getMoney(userId);
        
        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle('🎣 Câu Cá')
            .setDescription(`${message.author} câu được **${caught.name}**!`)
            .addFields(
                { name: '💰 Nhận được', value: `+ **${caught.value.toLocaleString('vi-VN')} VNĐ**` },
                { name: '💳 Số dư', value: `**${money.toLocaleString('vi-VN')} VNĐ**` }
            )
            .setFooter({ text: '⏰ 1 phút nữa câu tiếp!' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== ĐI CƯỚP (10 phút cooldown) ==========
    if (content === '.cuop') {
        const userId = message.author.id;
        const now = Date.now();
        const cooldownTime = 600000;
        
        // Kiểm tra tù
        if (jailUsers.has(userId)) {
            const jailEnd = jailUsers.get(userId);
            if (now < jailEnd) {
                const remaining = Math.floor((jailEnd - now) / 1000);
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                return message.reply(`🚔 Bạn đang bị **tù**! Hãy đợi **${minutes} phút ${seconds} giây** nữa!`);
            } else {
                jailUsers.delete(userId);
            }
        }
        
        // Kiểm tra cooldown
        if (crimeCooldown.has(userId)) {
            const remaining = cooldownTime - (now - crimeCooldown.get(userId));
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                return message.reply(`⏰ Bạn vừa đi cướp rồi! Hãy đợi **${minutes} phút ${seconds} giây** nữa!`);
            }
        }
        
        crimeCooldown.set(userId, now);
        
        const roll = Math.random() * 100;
        let resultText = '';
        let color = '';
        let amount = 0;
        
        if (roll < 50) {
            amount = 50000;
            color = '#00FF00';
            resultText = '✅ **THÀNH CÔNG!**\n🔫 Bạn cướp được ngân hàng!';
        } else if (roll < 80) {
            amount = 5000;
            color = '#FF6600';
            resultText = '⚠️ **HÊN XUI!**\n😅 Cướp hụt nhưng cũng nhặt được ít tiền lẻ!';
        } else {
            amount = -3500;
            color = '#FF0000';
            resultText = '🚔 **BỊ BẮT!**\n👮 Cảnh sát đã tóm được bạn!';
            jailUsers.set(userId, now + 60000);
        }
        
        if (amount > 0) {
            addMoney(userId, amount);
        } else {
            deductMoney(userId, Math.abs(amount));
        }
        
        const money = getMoney(userId);
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🔫 Đi Cướp')
            .setDescription(`${message.author} ${resultText}`)
            .addFields(
                { name: '💰 Kết quả', value: amount > 0 ? `+ **${amount.toLocaleString('vi-VN')} VNĐ**` : `- **${Math.abs(amount).toLocaleString('vi-VN')} VNĐ**` },
                { name: '💳 Số dư', value: `**${money.toLocaleString('vi-VN')} VNĐ**` }
            )
            .setFooter({ text: amount < 0 && jailUsers.has(userId) ? '🚔 Bị tù 1 phút! | Cooldown 10 phút' : '⏰ 10 phút nữa cướp tiếp!' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    // ========== XỔ SỐ (5 phút quay 1 lần) ==========
    if (content === '.xoso') {
        const userId = message.author.id;
        const ticketPrice = 10000;
        
        if (getMoney(userId) < ticketPrice) {
            return message.reply('❌ Bạn cần **10,000 VNĐ** để mua vé!\n💰 Số dư: **' + getMoney(userId).toLocaleString('vi-VN') + ' VNĐ**');
        }
        
        deductMoney(userId, ticketPrice);
        
        const ticketNumbers = [];
        for (let i = 0; i < 4; i++) {
            ticketNumbers.push(Math.floor(Math.random() * 10));
        }
        
        xosoTickets.push({
            userId: userId,
            username: message.author.username,
            numbers: ticketNumbers,
            time: Date.now()
        });
        
        const ticketDisplay = ticketNumbers.map(n => `[${n}]`).join(' ');
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎫 XỔ SỐ KIẾN THIẾT!')
            .setDescription(`${message.author} đã mua vé xổ số!`)
            .addFields(
                { name: '🎯 Vé của bạn', value: ticketDisplay },
                { name: '💰 Đã trừ', value: '**10,000 VNĐ**' },
                { name: '⏰ Thời gian', value: 'Kết quả sau **5 phút** nữa!' }
            )
            .setFooter({ text: 'Chúc may mắn! 🍀' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
        
        if (!xosoTimeout) {
            xosoTimeout = setTimeout(async () => {
                const giaiNhat = [];
                const giaiNhi = [];
                const giaiDB = [];
                
                for (let i = 0; i < 4; i++) {
                    giaiNhat.push(Math.floor(Math.random() * 10));
                    giaiNhi.push(Math.floor(Math.random() * 10));
                    giaiDB.push(Math.floor(Math.random() * 10));
                }
                
                if (xosoTickets.length > 0) {
                    const randomTicket = xosoTickets[Math.floor(Math.random() * xosoTickets.length)];
                    const randomPrize = Math.floor(Math.random() * 3);
                    
                    if (randomPrize === 0) {
                        for (let i = 0; i < 4; i++) giaiNhat[i] = randomTicket.numbers[i];
                    } else if (randomPrize === 1) {
                        for (let i = 0; i < 4; i++) giaiNhi[i] = randomTicket.numbers[i];
                    } else {
                        for (let i = 0; i < 4; i++) giaiDB[i] = randomTicket.numbers[i];
                    }
                }
                
                xosoResult = { giaiNhat, giaiNhi, giaiDB, time: Date.now() };
                
                const giaiNhatDisplay = giaiNhat.map(n => `[${n}]`).join(' ');
                const giaiNhiDisplay = giaiNhi.map(n => `[${n}]`).join(' ');
                const giaiDBDisplay = giaiDB.map(n => `[${n}]`).join(' ');
                
                for (const ticket of xosoTickets) {
                    const ticketDisplay = ticket.numbers.map(n => `[${n}]`).join(' ');
                    let winAmount = 0;
                    let winText = '';
                    
                    const trungNhat = ticket.numbers.every((n, i) => n === giaiNhat[i]);
                    const trungNhi = ticket.numbers.every((n, i) => n === giaiNhi[i]);
                    const trungDB = ticket.numbers.every((n, i) => n === giaiDB[i]);
                    
                    if (trungDB) { winAmount += 2000000; winText += '🥇 **Giải Đặc Biệt! +2,000,000 VNĐ**\n'; }
                    if (trungNhi) { winAmount += 60000; winText += '🥈 **Giải Nhì! +60,000 VNĐ**\n'; }
                    if (trungNhat) { winAmount += 15000; winText += '🥉 **Giải Nhất! +15,000 VNĐ**\n'; }
                    
                    if (winAmount > 0) {
                        addMoney(ticket.userId, winAmount);
                    }
                    
                    try {
                        const user = await client.users.fetch(ticket.userId);
                        const resultEmbed = new EmbedBuilder()
                            .setColor(winAmount > 0 ? '#00FF00' : '#FF6600')
                            .setTitle(winAmount > 0 ? '🎉 TRÚNG THƯỞNG!' : '😢 KẾT QUẢ XỔ SỐ')
                            .setDescription(
                                `🥉 Giải Nhất: ${giaiNhatDisplay}\n` +
                                `🥈 Giải Nhì: ${giaiNhiDisplay}\n` +
                                `🥇 Giải ĐB: ${giaiDBDisplay}\n\n` +
                                `🎯 Vé của bạn: ${ticketDisplay}`
                            )
                            .addFields(
                                { name: '📊 Kết quả', value: winAmount > 0 ? winText : '❌ Chúc may mắn lần sau!' },
                                { name: '💰 Số dư', value: `**${getMoney(ticket.userId).toLocaleString('vi-VN')} VNĐ**` }
                            )
                            .setFooter({ text: 'Xổ Số Kiến Thiết | 5 phút/lần' })
                            .setTimestamp();
                        
                        await user.send({ embeds: [resultEmbed] }).catch(() => {});
                    } catch (e) {}
                }
                
                const channelEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🎉 KẾT QUẢ XỔ SỐ!')
                    .setDescription(
                        `🥉 **Giải Nhất:** ${giaiNhatDisplay} | Thưởng: 15,000 VNĐ\n` +
                        `🥈 **Giải Nhì:** ${giaiNhiDisplay} | Thưởng: 60,000 VNĐ\n` +
                        `🥇 **Giải ĐB:** ${giaiDBDisplay} | Thưởng: 2,000,000 VNĐ`
                    )
                    .setFooter({ text: 'Dùng .xoso để mua vé mới!' })
                    .setTimestamp();
                
                await message.channel.send({ embeds: [channelEmbed] });
                
                xosoTickets.length = 0;
                xosoResult = null;
                xosoTimeout = null;
                
            }, 300000);
        }
        
        return;
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

    // ========== THÁCH ĐẤU 1V1 (.cao @nguoi <tien>) ==========
    if (content.startsWith('.cao') && message.mentions.users.size > 0) {
        const args = message.content.split(' ');
        args.shift();
        
        const targetUser = message.mentions.users.first();
        if (!targetUser || targetUser.bot || targetUser.id === message.author.id) {
            return message.reply('❌ Vui lòng tag **người thật** để thách đấu!\n`.cao @nguoi <tiền_cược>`\n💡 Có thể cược chênh lệch!');
        }
        
        const myBet = parseInt(args[args.length - 1]);
        if (isNaN(myBet) || myBet < 100) {
            return message.reply('❌ Cược tối thiểu **100 VNĐ**!\n`.cao @nguoi <tiền_cược>`');
        }
        
        if (getMoney(message.author.id) < myBet) {
            return message.reply('❌ Bạn không đủ tiền!\n💰 Số dư: **' + getMoney(message.author.id).toLocaleString('vi-VN') + ' VNĐ**');
        }
        
        const challengeKey = message.author.id + '_' + targetUser.id;
        const reverseKey = targetUser.id + '_' + message.author.id;
        
        if (challenges.has(reverseKey)) {
            const existingChallenge = challenges.get(reverseKey);
            challenges.delete(reverseKey);
            
            const p1Bet = existingChallenge.amount;
            const p2Bet = myBet;
            
            if (getMoney(targetUser.id) < p1Bet) {
                return message.reply('❌ ' + targetUser.username + ' không đủ tiền cược ' + p1Bet.toLocaleString('vi-VN') + ' VNĐ!');
            }
            
            deductMoney(targetUser.id, p1Bet);
            deductMoney(message.author.id, p2Bet);
            
            const totalPool = p1Bet + p2Bet;
            const game = new CardGame();
            const p1Cards = game.drawHand(3);
            const p2Cards = game.drawHand(3);
            
            const p1Score = calculateScore(p1Cards);
            const p2Score = calculateScore(p2Cards);
            const p1Special = checkSpecial(p1Cards);
            const p2Special = checkSpecial(p2Cards);
            
            const p1Display = p1Cards.map(c => getCardDisplay(c)).join(' ');
            const p2Display = p2Cards.map(c => getCardDisplay(c)).join(' ');
            
            let winner = null;
            let resultText = '';
            let color = '';
            
            if (p1Special && !p2Special) { winner = targetUser; color = '#FFD700'; resultText = targetUser.username + ' THẮNG (Sáp!)'; }
            else if (!p1Special && p2Special) { winner = message.author; color = '#FFD700'; resultText = message.author.username + ' THẮNG (Sáp!)'; }
            else if (p1Special && p2Special) {
                if (p1Special === p2Special) {
                    if (p1Score > p2Score) { winner = targetUser; color = '#FFD700'; resultText = targetUser.username + ' THẮNG!'; }
                    else if (p2Score > p1Score) { winner = message.author; color = '#FFD700'; resultText = message.author.username + ' THẮNG!'; }
                    else { color = '#FFFF00'; resultText = 'HÒA!'; }
                } else {
                    if (p1Special === 'SÁP 🔥') { winner = targetUser; color = '#FFD700'; resultText = targetUser.username + ' THẮNG (Sáp)!'; }
                    else { winner = message.author; color = '#FFD700'; resultText = message.author.username + ' THẮNG (Sáp)!'; }
                }
            } else {
                if (p1Score > p2Score) { winner = targetUser; color = '#FFD700'; resultText = targetUser.username + ' THẮNG!'; }
                else if (p2Score > p1Score) { winner = message.author; color = '#FFD700'; resultText = message.author.username + ' THẮNG!'; }
                else { color = '#FFFF00'; resultText = 'HÒA!'; }
            }
            
            if (winner) {
                addMoney(winner.id, totalPool);
                resultText += '\n💰 Nhận **' + totalPool.toLocaleString('vi-VN') + ' VNĐ**';
            } else {
                addMoney(targetUser.id, p1Bet);
                addMoney(message.author.id, p2Bet);
                resultText += '\n💰 Hoàn cược!';
            }
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('⚔️ KẾT QUẢ THÁCH ĐẤU!')
                .setDescription(targetUser.username + ' cược: **' + p1Bet.toLocaleString('vi-VN') + ' VNĐ**\n' + message.author.username + ' cược: **' + p2Bet.toLocaleString('vi-VN') + ' VNĐ**\nTổng: **' + totalPool.toLocaleString('vi-VN') + ' VNĐ**')
                .addFields(
                    { name: '👤 ' + targetUser.username, value: p1Display + '\n' + (p1Special ? '**' + p1Special + '** + ' : '') + getScoreName(p1Score), inline: true },
                    { name: '👤 ' + message.author.username, value: p2Display + '\n' + (p2Special ? '**' + p2Special + '** + ' : '') + getScoreName(p2Score), inline: true },
                    { name: '🏆 Kết quả', value: resultText, inline: false }
                )
                .setFooter({ text: 'Dùng .cao @nguoi <tien> để thách đấu! Hỗ trợ cược chênh lệch!' })
                .setTimestamp();
            
            return message.reply({ content: targetUser.toString(), embeds: [embed] });
            
        } else {
            challenges.set(challengeKey, { challenger: message.author.id, target: targetUser.id, amount: myBet, time: Date.now() });
            
            setTimeout(() => { if (challenges.has(challengeKey)) challenges.delete(challengeKey); }, 60000);
            
            return message.reply(
                '⚔️ **THÁCH ĐẤU BÀI CÀO!**\n\n' +
                message.author.toString() + ' muốn đấu với ' + targetUser.toString() + '\n' +
                '💰 ' + message.author.username + ' cược: **' + myBet.toLocaleString('vi-VN') + ' VNĐ**\n' +
                '💡 ' + targetUser.username + ' có thể cược số khác!\n\n' +
                '👉 ' + targetUser.toString() + ' gõ: `.cao @' + message.author.username + ' <tiền_của_bạn>` để chấp nhận!\n' +
                '⏰ Hết hạn sau **60 giây**!'
            );
        }
        return;
    }

    // ========== CHƠI BÀI CÀO VỚI BOT (.cao <tien>) ==========
    if (content.startsWith('.cao')) {
        const args = message.content.split(' ');
        const bet = parseInt(args[1]);

        if (isNaN(bet) || bet < 100) {
            return message.reply('❌ Cược tối thiểu **100 VNĐ**!\n`.cao <số_tiền>`');
        }

        const totalPool = bet * 2;

        if (getMoney(message.author.id) < bet) {
            return message.reply('❌ Không đủ tiền!\n💰 Số dư: **' + getMoney(message.author.id).toLocaleString('vi-VN') + ' VNĐ**');
        }

        deductMoney(message.author.id, bet);

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
            result = 'THẮNG (Sáp!)';
            color = '#FFD700';
            winAmount = totalPool;
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
                if (playerScore > botScore) {
                    result = 'THẮNG';
                    color = '#FFD700';
                    winAmount = totalPool;
                } else {
                    result = 'THUA';
                    color = '#FF0000';
                    winAmount = 0;
                }
            }
        } else {
            if (playerScore > botScore) {
                result = 'THẮNG';
                color = '#FFD700';
                winAmount = totalPool;
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

        if (winAmount > 0) {
            addMoney(message.author.id, winAmount);
        }

        const displayAmount = winAmount > bet ? `+ **${winAmount.toLocaleString('vi-VN')} VNĐ** (gốc ${bet.toLocaleString()} + tiền bot ${bet.toLocaleString()})` :
                              winAmount === bet ? `Hoàn **${bet.toLocaleString('vi-VN')} VNĐ**` :
                              `Mất **${bet.toLocaleString('vi-VN')} VNĐ**`;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`🃏 Bài Cào - ${result}!`)
            .setDescription(`Cược mỗi bên: **${bet.toLocaleString('vi-VN')} VNĐ**\nTổng: **${totalPool.toLocaleString('vi-VN')} VNĐ**`)
            .addFields(
                { name: `👤 ${message.author.username}`, value: `${playerDisplay}\n${playerSpecial ? `**${playerSpecial}** + ` : ''}${getScoreName(playerScore)}`, inline: true },
                { name: `🤖 Bot`, value: `${botDisplay}\n${botSpecial ? `**${botSpecial}** + ` : ''}${getScoreName(botScore)}`, inline: true },
                { name: '💰 Kết quả', value: displayAmount, inline: false }
            )
            .setFooter({ text: `Số dư: ${getMoney(message.author.id).toLocaleString('vi-VN')} VNĐ | Tự động lưu 💾` });

        return message.reply({ embeds: [embed] });
    }

    // ========== TÀI XỈU ==========
    if (content.startsWith('.taixiu')) {
        if (activeTaiXiuGames.has(message.channel.id)) {
            return message.reply('❌ Đã có bàn tài xỉu đang chạy trong kênh này! Đợi kết thúc nhé.');
        }

        const args = message.content.split(' ');
        let betAmount = parseInt(args[1]);
        
        if (isNaN(betAmount) || betAmount < 100) {
            betAmount = 100;
        }
        
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
                `**Đặt cược: ${betAmount.toLocaleString('vi-VN')} VNĐ**\n\n` +
                '🔴 **TÀI**: 11-18 (x2 tiền)\n' +
                '🔵 **XỈU**: 3-10 (x2 tiền)\n\n' +
                '⏰ **45 giây** để đặt cược!\n' +
                '👤 Người chơi tham gia bấm nút bên dưới'
            )
            .setFooter({ text: `Cược: ${betAmount.toLocaleString('vi-VN')} VNĐ | Bấm nút để đặt cược!` })
            .setTimestamp();

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });

        const gameData = {
            messageId: gameMessage.id,
            channelId: message.channel.id,
            taiPlayers: new Set(),
            xiuPlayers: new Set(),
            bets: new Map(),
            betAmount: betAmount,
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
                    `**Đặt cược: ${game.betAmount.toLocaleString('vi-VN')} VNĐ**\n\n` +
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
        if (money < game.betAmount) {
            return interaction.followUp({ content: `❌ ${interaction.user} không đủ tiền! Cần ${game.betAmount.toLocaleString('vi-VN')} VNĐ`, ephemeral: true });
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

        interaction.followUp({ content: `✅ ${interaction.user} đã đặt cược ${game.betAmount.toLocaleString('vi-VN')} VNĐ!`, ephemeral: true });
    }
});

// ========== HÀM LẮC TÀI XỈU ==========
async function shakeTaiXiu(gameMessage, game, row) {
    const channel = gameMessage.channel;
    const betAmount = game.betAmount;
    
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
        
        deductMoney(userId, betAmount);
        
        let win = false;
        if (bet === 'both') {
            win = true;
        } else if (bet === result) {
            win = true;
        }
        
        if (win) {
            if (bet === 'both') {
                addMoney(userId, betAmount);
                resultsText += `✅ ${user.username}: Hoàn cược (đặt cả 2)\n`;
            } else {
                addMoney(userId, betAmount * 2);
                resultsText += `✅ ${user.username}: +${(betAmount * 2).toLocaleString('vi-VN')} VNĐ\n`;
            }
        } else {
            resultsText += `❌ ${user.username}: -${betAmount.toLocaleString('vi-VN')} VNĐ\n`;
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
        .setFooter({ text: `Cược: ${betAmount.toLocaleString('vi-VN')} VNĐ | Dùng .taixiu <cược> để chơi tiếp` })
        .setTimestamp();

    await gameMessage.edit({ embeds: [resultEmbed], components: [disabledRow] });

    activeTaiXiuGames.delete(game.channelId);
}

// ========== LOGIN ==========
client.login(CONFIG.token).then(() => {
    console.log('🃏 Bot Bài Cào + Tài Xỉu đã sẵn sàng!');
    console.log('📋 Lệnh: .cao .cao @nguoi .taixiu .cauca .cuop .xoso .ruachen .money .daily .bank .admin .top .help');
    console.log('💾 Tự động lưu tiền vào file userdata.json');
    console.log('⏰ Daily: 1h30p | Rửa chén: 45s | Câu cá: 1p | Cướp: 10p | Xổ số: 5p');
    console.log('👑 Admin: .admin (+500,000 VNĐ) chỉ Owner');
    console.log('🎲 Tài Xỉu: Nhập cược + nút bấm + 45s đếm ngược');
    console.log('🃏 Bài Cào: Đánh với bot + Thách đấu 1v1 (cược chênh lệch)');
    console.log('🎫 Xổ Số: .xoso - Mua vé 10k, quay mỗi 5 phút!');
}).catch(console.error); 
