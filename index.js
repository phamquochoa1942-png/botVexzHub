// =============================================
// DISCORD BÀI CÀO 3 LÁ BOT
// Lệnh: .cao | Tự động ping 24/7
// =============================================

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const http = require('http');

const CONFIG = {
    token: process.env.TOKEN || "YOUR_BOT_TOKEN_HERE",
    prefix: ".",
    port: process.env.PORT || 3000
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
    
    return total % 10; // Chỉ lấy hàng đơn vị (0-9)
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
    
    // Sáp (3 lá giống nhau)
    if (uniqueValues.size === 1) return 'SÁP 🔥';
    
    // Liêng (3 lá liên tiếp)
    const valueOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const indices = values.map(v => valueOrder.indexOf(v)).sort((a, b) => a - b);
    if (indices[2] - indices[1] === 1 && indices[1] - indices[0] === 1) return 'LIÊNG ✨';
    
    // 3 Tây (J, Q, K)
    if (values.every(v => ['J', 'Q', 'K'].includes(v))) return '3 TÂY 👑';
    
    return null;
}

function getCardDisplay(card) {
    const colors = { '♥': '🔴', '♦': '🔴', '♠': '⚫', '♣': '⚫' };
    return `${colors[card.suit]}${card.value}${card.suit}`;
}

// ========== DATABASE TIỀN ẢO ==========
const userMoney = new Map();

function getMoney(userId) {
    if (!userMoney.has(userId)) {
        userMoney.set(userId, 10000); // Tặng 10k khởi đầu
    }
    return userMoney.get(userId);
}

function addMoney(userId, amount) {
    userMoney.set(userId, getMoney(userId) + amount);
}

function deductMoney(userId, amount) {
    const current = getMoney(userId);
    if (current < amount) return false;
    userMoney.set(userId, current - amount);
    return true;
}

// ========== BOT EVENTS ==========
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} - Bot Bài Cào Online!`);
    client.user.setPresence({ activities: [{ name: '.cao | Bài Cào 3 Lá', type: 'PLAYING' }], status: 'online' });
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
                { name: '💰 Lệnh tiền', value: '`.money` - Xem tiền\n`.daily` - Nhận 5k/ngày' },
                { name: '📋 Luật chơi', value: 'Bài cào 3 lá, điểm 0-9\nNút (9 điểm) = THẮNG\nSáp > Liêng > 3 Tây > Điểm' }
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

    // ========== DAILY ==========
    if (content === '.daily') {
        addMoney(message.author.id, 5000);
        const money = getMoney(message.author.id);
        return message.reply(`🎁 Nhận **5,000 VNĐ** thành công!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
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

        // Tạo bộ bài
        const game = new CardGame();
        const playerCards = game.drawHand(3);
        const botCards = game.drawHand(3);

        const playerScore = calculateScore(playerCards);
        const botScore = calculateScore(botCards);
        const playerSpecial = checkSpecial(playerCards);
        const botSpecial = checkSpecial(botCards);

        // Tạo embed hiển thị
        const playerDisplay = playerCards.map(c => getCardDisplay(c)).join(' ');
        const botDisplay = botCards.map(c => getCardDisplay(c)).join(' ');

        // Xác định kết quả
        let result = '';
        let color = '';
        let winAmount = 0;

        // Ưu tiên đặc biệt trước
        if (playerSpecial && !botSpecial) {
            result = 'THẮNG';
            color = '#FFD700';
            winAmount = bet * 3;
        } else if (!playerSpecial && botSpecial) {
            result = 'THUA';
            color = '#FF0000';
            winAmount = 0;
        } else if (playerSpecial && botSpecial) {
            // Cùng đặc biệt → so sánh
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
            // So điểm
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

        // Cập nhật tiền
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
            .setFooter({ text: `Số dư: ${getMoney(message.author.id).toLocaleString('vi-VN')} VNĐ` });

        return message.reply({ embeds: [embed] });
    }
});

// ========== LOGIN ==========
client.login(CONFIG.token).then(() => {
    console.log('🃏 Bot Bài Cào 3 Lá đã sẵn sàng!');
    console.log('📋 Lệnh: .cao .money .daily .help');
}).catch(console.error); 
