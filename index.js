// =============================================
// DISCORD BÀI CÀO 3 LÁ + TÀI XỈU BOT - APPLICATION EMOJIS
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
    ownerID: "1486380909736366120"
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ========== HTTP SERVER ==========
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(CONFIG.port);

// ========== BỘ BÀI APPLICATION EMOJIS (ID TỪ DEVELOPER PORTAL) ==========
const boBai = [
    { id: "2_co", ten: "hai trái tim", emojiId: "1508021393621782758", diem: 2 },
    { id: "3_co", ten: "ba trái tim", emojiId: "1508021395588911295", diem: 3 },
    { id: "4_bich", ten: "bốn lá bài", emojiId: "1508021397476085840", diem: 4 },
    { id: "5_bich", ten: "năm lá bài", emojiId: "1508021400009070581", diem: 5 },
    { id: "6_bich", ten: "sáu lá bài", emojiId: "1508021403281264670", diem: 6 },
    { id: "7_chuon", ten: "bảy câu lạc bộ", emojiId: "1508021405726539836", diem: 7 },
    { id: "8_co", ten: "tâm cơ", emojiId: "1508021408029216899", diem: 8 },
    { id: "9_chuon", ten: "chín câu lạc bộ", emojiId: "1508021410130563193", diem: 9 },
    { id: "10_co", ten: "tenofhearts", emojiId: "1508021412336631889", diem: 10 },
    { id: "J_chuon", ten: "jackofclubs1", emojiId: "1508021414370869289", diem: 10 },
    { id: "Q_co", ten: "nữ hoàng của trái tim", emojiId: "1508021416501579826", diem: 10 },
    { id: "K_chuon", ten: "vua của các câu lạc bộ", emojiId: "1508021418586017892", diem: 10 }
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
    // Dùng Application Emoji - chỉ bot dùng được!
    return `<:${card.ten}:${card.emojiId}>`;
}

// ========== DATABASE TIỀN ẢO ==========
let userMoney = new Map();

function loadData() {
    try {
        if (fs.existsSync(CONFIG.dataFile)) {
            const rawData = fs.readFileSync(CONFIG.dataFile, 'utf8');
            const parsedData = JSON.parse(rawData);
            userMoney = new Map(Object.entries(parsedData));
            console.log(`✅ Đã tải dữ liệu ${userMoney.size} người dùng!`);
        } else {
            console.log('📁 Chưa có file, tạo mới...');
            saveData();
        }
    } catch (error) {
        console.error('❌ Lỗi tải:', error.message);
        userMoney = new Map();
    }
}

function saveData() {
    try {
        const obj = Object.fromEntries(userMoney);
        fs.writeFileSync(CONFIG.dataFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Lỗi lưu:', error.message);
    }
}

setInterval(() => { if (userMoney.size > 0) saveData(); }, 30000);

process.on('SIGINT', () => { saveData(); process.exit(0); });
process.on('SIGTERM', () => { saveData(); process.exit(0); });

function getMoney(userId) {
    if (!userMoney.has(userId)) {
        userMoney.set(userId, 10000);
        saveData();
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

// ========== COOLDOWNS ==========
const dailyCooldown = new Map();
const ruaChenCooldown = new Map();
const activeTaiXiuGames = new Map();

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

// ========== BOT EVENTS ==========
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} - Bot Bài Cào + Tài Xỉu Online!`);
    loadData();
    client.user.setPresence({ activities: [{ name: '.cao .taixiu .ruachen .bank | 24/7', type: 'PLAYING' }], status: 'online' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = message.content.trim().toLowerCase();

    // HELP
    if (content === '.help') {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🃏 Bot Bài Cào + Tài Xỉu')
            .setDescription('Chơi bài cào và tài xỉu với bot!')
            .addFields(
                { name: '🎮 Lệnh chơi', value: '`.cao <cược>` - Bài cào\n`.taixiu` - Tài xỉu\n`.ruachen` - Rửa chén +1k (45s)' },
                { name: '💰 Lệnh tiền', value: '`.money` - Xem tiền\n`.daily` - Nhận 5k (1h30p)\n`.bank @user <tiền>` - Chuyển tiền\n`.top` - Top giàu' },
                { name: '👑 Admin', value: '`.admin` - Nhận 500k (Owner)' },
                { name: '💾 Lưu dữ liệu', value: '✅ Tự động lưu file\n✅ Không mất tiền' }
            );
        return message.reply({ embeds: [embed] });
    }

    // MONEY
    if (content === '.money') {
        const money = getMoney(message.author.id);
        const embed = new EmbedBuilder().setColor('#00FF00').setTitle(`💰 ${message.author.username}`).setDescription(`Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
        return message.reply({ embeds: [embed] });
    }

    // TOP
    if (content === '.top') {
        const sorted = [...userMoney.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        let ranking = '';
        for (let i = 0; i < sorted.length; i++) {
            const [userId, money] = sorted[i];
            const user = await client.users.fetch(userId).catch(() => null);
            const name = user ? user.username : 'Unknown';
            ranking += `**${i + 1}.** ${name} - 💰 ${money.toLocaleString('vi-VN')} VNĐ\n`;
        }
        if (!ranking) ranking = 'Chưa có ai!';
        const embed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Top Giàu').setDescription(ranking).setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // DAILY
    if (content === '.daily') {
        const check = canUseDaily(message.author.id);
        if (!check.canUse) return message.reply(`⏰ Đợi **${check.timeStr}** nữa!`);
        dailyCooldown.set(message.author.id, Date.now());
        addMoney(message.author.id, 5000);
        const money = getMoney(message.author.id);
        return message.reply(`🎁 +5,000 VNĐ!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
    }

    // RỬA CHÉN
    if (content === '.ruachen') {
        const check = canUseRuaChen(message.author.id);
        if (!check.canUse) return message.reply(`🍽️ Đợi **${check.timeStr}** nữa!`);
        ruaChenCooldown.set(message.author.id, Date.now());
        addMoney(message.author.id, 1000);
        const money = getMoney(message.author.id);
        return message.reply(`🍽️ Rửa chén +1,000 VNĐ!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
    }

    // ADMIN
    if (content === '.admin') {
        if (message.author.id !== CONFIG.ownerID) return message.reply('❌ Chỉ Owner!');
        addMoney(message.author.id, 500000);
        const money = getMoney(message.author.id);
        return message.reply(`👑 +500,000 VNĐ!\n💰 Số dư: **${money.toLocaleString('vi-VN')} VNĐ**`);
    }

    // BANK
    if (content.startsWith('.bank')) {
        const args = message.content.split(' ');
        args.shift();
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Tag người nhận!\n`.bank @user <tiền>`');
        if (targetUser.id === message.author.id) return message.reply('❌ Không chuyển cho mình!');
        if (targetUser.bot) return message.reply('❌ Không chuyển cho bot!');
        const amount = parseInt(args.find(a => !isNaN(parseInt(a))));
        if (isNaN(amount) || amount < 100) return message.reply('❌ Tối thiểu 100 VNĐ!');
        if (!deductMoney(message.author.id, amount)) return message.reply('❌ Không đủ tiền!');
        addMoney(targetUser.id, amount);
        return message.reply(`🏦 ${message.author} ➜ **${amount.toLocaleString('vi-VN')} VNĐ** ➜ ${targetUser}`);
    }

    // BÀI CÀO
    if (content.startsWith('.cao')) {
        const args = message.content.split(' ');
        const bet = parseInt(args[1]);
        if (isNaN(bet) || bet < 100) return message.reply('❌ Cược tối thiểu 100 VNĐ!');
        if (!deductMoney(message.author.id, bet)) return message.reply('❌ Không đủ tiền!');

        const game = new CardGame();
        const playerCards = game.drawHand(3);
        const botCards = game.drawHand(3);
        const playerScore = calculateScore(playerCards);
        const botScore = calculateScore(botCards);
        const playerSpecial = checkSpecial(playerCards);
        const botSpecial = checkSpecial(botCards);
        const playerDisplay = playerCards.map(c => getCardDisplay(c)).join(' ');
        const botDisplay = botCards.map(c => getCardDisplay(c)).join(' ');

        let result = '', color = '', winAmount = 0;
        if (playerSpecial && !botSpecial) { result = 'THẮNG'; color = '#FFD700'; winAmount = bet * 3; }
        else if (!playerSpecial && botSpecial) { result = 'THUA'; color = '#FF0000'; }
        else if (playerSpecial && botSpecial) {
            if (playerSpecial === botSpecial) { result = 'HÒA'; color = '#FFFF00'; winAmount = bet; }
            else { result = playerScore > botScore ? 'THẮNG' : 'THUA'; color = result === 'THẮNG' ? '#FFD700' : '#FF0000'; winAmount = result === 'THẮNG' ? bet * 2 : 0; }
        } else {
            if (playerScore > botScore) { result = 'THẮNG'; color = '#FFD700'; winAmount = bet * 2; }
            else if (playerScore < botScore) { result = 'THUA'; color = '#FF0000'; }
            else { result = 'HÒA'; color = '#FFFF00'; winAmount = bet; }
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
            .setFooter({ text: `Số dư: ${getMoney(message.author.id).toLocaleString('vi-VN')} VNĐ` });
        return message.reply({ embeds: [embed] });
    }

    // TÀI XỈU
    if (content === '.taixiu') {
        if (activeTaiXiuGames.has(message.channel.id)) return message.reply('❌ Đã có bàn đang chạy!');
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tx_tai').setLabel('TÀI (11-18)').setStyle(ButtonStyle.Danger).setEmoji('🔴'),
            new ButtonBuilder().setCustomId('tx_xiu').setLabel('XỈU (3-10)').setStyle(ButtonStyle.Primary).setEmoji('🔵')
        );

        const embed = new EmbedBuilder().setColor('#FF6600').setTitle('🎲 BÀN TÀI XỈU')
            .setDescription('**Cược: 100 VNĐ**\n\n🔴 TÀI: 11-18 (x2)\n🔵 XỈU: 3-10 (x2)\n\n⏰ **45 giây** để đặt cược!')
            .setFooter({ text: 'Bấm nút để đặt cược!' });

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const gameData = { messageId: gameMessage.id, channelId: message.channel.id, taiPlayers: new Set(), xiuPlayers: new Set(), bets: new Map(), timeLeft: 45 };
        activeTaiXiuGames.set(message.channel.id, gameData);

        const countdownInterval = setInterval(async () => {
            const game = activeTaiXiuGames.get(message.channel.id);
            if (!game) { clearInterval(countdownInterval); return; }
            game.timeLeft--;
            const updatedEmbed = EmbedBuilder.from(embed).setDescription(`**Cược: 100 VNĐ**\n\n🔴 TÀI: 11-18 (x2)\n🔵 XỈU: 3-10 (x2)\n\n⏰ Còn **${game.timeLeft}s**\n👤 Tài: **${game.taiPlayers.size}** | Xỉu: **${game.xiuPlayers.size}**`);
            try { await gameMessage.edit({ embeds: [updatedEmbed], components: [row] }); } catch {}
            if (game.timeLeft <= 0) { clearInterval(countdownInterval); await shakeTaiXiu(gameMessage, game, row); }
        }, 1000);
    }
});

// ========== BUTTON TÀI XỈU ==========
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const game = activeTaiXiuGames.get(interaction.channelId);
    if (!game) return;
    if (interaction.customId === 'tx_tai' || interaction.customId === 'tx_xiu') {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        if (getMoney(userId) < 100) return interaction.followUp({ content: '❌ Không đủ tiền!', ephemeral: true });
        if (interaction.customId === 'tx_tai') {
            if (game.taiPlayers.has(userId)) return interaction.followUp({ content: '❌ Đã đặt TÀI rồi!', ephemeral: true });
            game.taiPlayers.add(userId); game.bets.set(userId, 'tai');
        }
        if (interaction.customId === 'tx_xiu') {
            if (game.xiuPlayers.has(userId)) return interaction.followUp({ content: '❌ Đã đặt XỈU rồi!', ephemeral: true });
            game.xiuPlayers.add(userId);
            game.bets.set(userId, game.bets.has(userId) ? 'both' : 'xiu');
        }
        interaction.followUp({ content: '✅ Đã đặt cược!', ephemeral: true });
    }
});

// ========== HÀM LẮC TÀI XỈU ==========
async function shakeTaiXiu(gameMessage, game, row) {
    const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('tx_tai_end').setLabel('TÀI').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('tx_xiu_end').setLabel('XỈU').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    const shakeEmojis = ['🎲', '🎯', '🎰', '🎪', '🎡'];
    for (let i = 0; i < 5; i++) {
        const shakeEmbed = new EmbedBuilder().setColor('#FF6600').setTitle('🎲 ĐANG LẮC...').setDescription(`\`\`\`\n  ┌─────┐\n  │  ${shakeEmojis[i]}  │\n  └─────┘\n\`\`\``);
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
        let win = (bet === 'both' || bet === result);
        if (win) {
            if (bet === 'both') { addMoney(userId, 100); resultsText += `✅ ${user.username}: Hoàn cược\n`; }
            else { addMoney(userId, 200); resultsText += `✅ ${user.username}: +200 VNĐ\n`; }
        } else { deductMoney(userId, 100); resultsText += `❌ ${user.username}: -100 VNĐ\n`; }
    }
    if (!resultsText) resultsText = 'Không có ai!';

    const resultEmbed = new EmbedBuilder()
        .setColor(result === 'tai' ? '#FF0000' : '#0066FF')
        .setTitle(result === 'tai' ? '🔴 TÀI!' : '🔵 XỈU!')
        .setDescription(`\`\`\`\n  ┌───┬───┬───┐\n  │ ${diceEmojis[dice1]} │ ${diceEmojis[dice2]} │ ${diceEmojis[dice3]} │\n  ├───┼───┼───┤\n  │ ${dice1}  │ ${dice2}  │ ${dice3}  │\n  └───┴───┴───┘\n     TỔNG: ${total}\n\`\`\``)
        .addFields({ name: '📊 Kết quả', value: resultsText })
        .setTimestamp();

    await gameMessage.edit({ embeds: [resultEmbed], components: [disabledRow] });
    activeTaiXiuGames.delete(game.channelId);
}

// ========== LOGIN ==========
client.login(CONFIG.token).then(() => {
    console.log('🃏 Bot Bài Cào + Tài Xỉu đã sẵn sàng!');
    console.log('📋 Lệnh: .cao .taixiu .ruachen .money .daily .bank .admin .top .help');
    console.log('🃏 Dùng Application Emojis - chỉ bot dùng được!');
}).catch(console.error); 
