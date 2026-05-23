// =============================================
// DISCORD BÀI CÀO 3 LÁ BOT - TỰ ĐỘNG LƯU TIỀN
// Lệnh: .cao .bank .money .daily | Tự động ping 24/7
// =============================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    token: process.env.TOKEN || "YOUR_BOT_TOKEN_HERE",
    prefix: ".",
    port: process.env.PORT || 3000,
    dataFile: path.join(__dirname, 'userdata.json') // File lưu tiền
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ========== HTTP SERVER ==========
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(CONFIG.port);

// ========== BỘ BÀI ==========
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

class CardGame {
    constructor() {
        this.deck = [];
        this.resetDeck();
    }

    resetDeck() {
        this.deck = [];
        for (let suit of SUITS) {
            for (let value of VALUES) {
                this.deck.push({ suit, value });
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
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
        let value = card.value;
        if (['J', 'Q', 'K'].includes(value)) {
            total += 10;
        } else if (value === 'A') {
            total += 1;
        } else {
            total += parseInt(value);
        }
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
    const values = cards.map(c => c.value);
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size === 1) return 'SÁP 🔥';
    
    const valueOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const indices = values.map(v => valueOrder.indexOf(v)).sort((a, b) => a - b);
    if (indices[2] - indices[1] === 1 && indices[1] - indices[0] === 1) return 'LIÊNG ✨';
    
    if (values.every(v => ['J', 'Q', 'K'].includes(v))) return '3 TÂY 👑';
    
    return null;
}

function getCardDisplay(card) {
    const colors = { '♥': '🔴', '♦': '🔴', '♠': '⚫', '♣': '⚫' };
    return `${colors[card.suit]}${card.value}${card.suit}`;
}

// ========== DATABASE TIỀN ẢO (TỰ ĐỘNG LƯU VÀO FILE) ==========
let userMoney = new Map();

// Tải dữ liệu từ file khi bot khởi động
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

// Lưu dữ liệu vào file
function saveData() {
    try {
        const obj = Object.fromEntries(userMoney);
        fs.writeFileSync(CONFIG.dataFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Lỗi lưu dữ liệu:', error.message);
    }
}

// Tự động lưu mỗi 30 giây
setInterval(() => {
    if (userMoney.size > 0) {
        saveData();
        console.log(`💾 Đã tự động lưu ${userMoney.size} người dùng`);
    }
}, 30000);

// Lưu khi bot tắt
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
        saveData(); // Lưu ngay khi tạo user mới
        console.log(`🆕 Người dùng mới: ${userId} - Tặng 10,000 VNĐ`);
    }
    return userMoney.get(userId);
}

function addMoney(userId, amount) {
    const current = getMoney(userId);
    userMoney.set(userId, current + amount);
    saveData(); // Lưu ngay sau khi thay đổi
}

function deductMoney(userId, amount) {
    const current = getMoney(userId);
    if (current < amount) return false;
    userMoney.set(userId, current - amount);
    saveData(); // Lưu ngay sau khi thay đổi
    return true;
}

// ========== BOT EVENTS ==========
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} - Bot Bài Cào Online!`);
    loadData(); // Tải dữ liệu khi bot khởi động
    client.user.setPresence({ activities: [{ name: '.cao .bank | Bài Cào 3 Lá', type: 'PLAYING' }], status: 'online' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = message.content.trim().toLowerCase();

    // ========== HELP ==========
    if (content === '.help') {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🃏 Bot Bài Cào 3 Lá - Hướng Dẫn')
            .setDescription('Chơi bài cào với bot!')
            .addFields(
                { name: '🎮 Lệnh chơi', value: '`.cao <tiền_cược>` - Chơi bài cào' },
                { name: '💰 Lệnh tiền', value: '`.money` - Xem tiền\n`.daily` - Nhận 5k/ngày\n`.bank <@user> <số_tiền>` - Chuyển tiền cho người khác\n`.top` - Xem top giàu' },
                { name: '📋 Luật chơi', value: 'Bài cào 3 lá, điểm 0-9\nNút (9 điểm) = THẮNG\nSáp > Liêng > 3 Tây > Điểm' },
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

    // ========== DAILY ==========
    if (content === '.daily') {
        addMoney(message.author.id, 5000);
        const money = getMoney(message.author.id);
        return message.reply(`🎁 Nhận **5,000 VNĐ** thành công!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
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
});

// ========== LOGIN ==========
client.login(CONFIG.token).then(() => {
    console.log('🃏 Bot Bài Cào 3 Lá đã sẵn sàng!');
    console.log('📋 Lệnh: .cao .money .daily .bank .top .help');
    console.log('💾 Tự động lưu tiền vào file userdata.json');
    console.log('🔄 Tự động lưu mỗi 30 giây + khi tắt bot');
}).catch(console.error); 
