require('dotenv').config();

var fs = require('fs');
const discord = require('discord.js');
const client = new discord.Client();
const PREFIX = "!";
client.login(process.env.DISCORD_BOT_TOKEN);
const LOG_CHANNEL = '809313815522312202'; 
const SERVER_ID = '313493970250629120'; 
const TIMEOUT_ID = '376112911728246785' 
const MOD_TEAM = ['173620782092517376', '322917297763123202', '243083529871818752', '239572326822182912', '164002296278024192'];
var blacklist = objToStrMap(JSON.parse(fs.readFileSync('blacklist.json')))

client.on('ready', () => {
    console.log(`${client.user.tag} The bot has logged in`);
});

const isValidCommand = (message, cmdName) => ((message.content.toLowerCase().startsWith(PREFIX + cmdName.toLowerCase() + ' ') || 
                                              (message.content.toLowerCase() === PREFIX + cmdName.toLowerCase())))

client.on('message', async(message) => {
    if (message.author.bot) return;

    if (!MOD_TEAM.includes(message.author.id)){ 
        blacklist.forEach((item) => {
            if (message.content.toLowerCase().indexOf(item.toLowerCase()) !== -1){ // checking for blacklisted words
                message.delete();
                message.guild.roles.fetch(TIMEOUT_ID)
                    .then(role => {
                        message.member.roles.add(role)
                        client.channels.fetch(LOG_CHANNEL)
                        .then(channel => channel.send(`**${message.author.tag}** timed out for saying a blacklisted word`))
                        .catch(console.error);
                return;
                    })
                    .catch(console.error);
                }
        })
    }

    if (message.channel instanceof discord.DMChannel){ // logging DMs
        if (message.attachments.size !== 0){
            attachments = '**Attachments:** ';
            message.attachments.forEach( (value) => {
                attachments += value.proxyURL + ' ';
            });
        }else{attachments = ''};
        client.channels.fetch(LOG_CHANNEL)
            .then(channel => channel.send(`**[DM Message]${message.author.tag}:** ${message.content}\n${attachments}`))
            .catch(console.error);
    }

    if(isValidCommand(message, "hello")) message.reply("Hello");
    if(isValidCommand(message, "hi")) message.reply("Hi");

    if(isValidCommand(message,'rolldice')){
        const rollDice = () => Math.floor(Math.random()*6 + 1);
        message.reply(`Rolled a ${rollDice()}`).catch(console.error);
    }

    if(isValidCommand(message,'say')){
        if (MOD_TEAM.includes(message.author.id)){
            let args = message.content.substring('say'.length+2);
            channel_id = args.split(' ')[0];
            client.channels.fetch(channel_id)
                .then(channel => channel.send(args.substring(channel_id.length + 1)).then(message.react('✅'), console.error))
                .catch(console.error);
        }else{
            message.react('🤡');
        }
    }

    if(isValidCommand(message,'set_status')){
        if (MOD_TEAM.includes(message.author.id)){
            let args = message.content.substring('set_status'.length+2);
            keyword = args.split(' ')[0].toLowerCase();
            switch(keyword){
                case 'playing':
                    type = 'PLAYING';
                    break;
                case 'listening':
                    type = 'LISTENING';
                    break;
                case 'watching':
                    type = 'WATCHING';
                    break;    
                case 'competing':
                    type = "COMPETING";
                    break;
                default:
                    type = 'PLAYING';
            }
            client.user.setActivity(args.substring(1 + keyword.length), { type: type })
                .then(message.react('✅'))
                .catch(console.error);
        }else{
            message.react('🤡');
        }
    }

    if(isValidCommand(message, 'addToBlacklist')){ // adding words to blacklist
        let args = message.content.substring('addToBlacklist'.length+2);
        if (MOD_TEAM.includes(message.author.id) && args !== ''){
            blacklist.set(args, args);
            fs.writeFile('blacklist.json', JSON.stringify(strMapToObj(blacklist), null, '\t'), () =>{
                console.log(`"${args}" added to blacklist `);
            });
            message.react('✅');
        }
    } 

    if(isValidCommand(message, 'removeFromBlacklist')){ // removing words from blacklist
        if(MOD_TEAM.includes(message.author.id)){
            let args = message.content.substring('removeFromBlacklist'.length+2);
            if(blacklist.has(args)){
                blacklist.delete(args);
                fs.writeFile('blacklist.json', JSON.stringify(strMapToObj(blacklist), null, '\t'), () =>console.log(`"${args}" removed from blacklist`));
                message.react('✅');
            }else{
                message.channel.send('Word provided not blacklisted');
            }
        }
    }

    if(isValidCommand(message, 'blacklist')){ // getting the list of blacklisted words
        if(MOD_TEAM.includes(message.author.id)){
            response = '';
            blacklist.forEach((value) =>{
                response += value + ', ';
            });
            message.author.createDM()
                .then(channel => channel.send(`**The blacklisted words are:** ${response.slice(0,-2)+'.'}`))
                .catch(console.error);
        }
    }

    if(isValidCommand(message, 'help_avarosa')){ // getting the list of commands
        if(MOD_TEAM.includes(message.author.id)){
            response = '**The current commands are:** hello, hi, rolldice, say, set_status, addToBlacklist, removeFromBlacklist, blacklist and help_avarosa';
            message.channel.send(response);
        }
    }
});

function strMapToObj(strMap) { // transform map to obj
    let obj = Object.create(null);
    for (let [k,v] of strMap) {
      obj[k] = v;
    }
    return obj;
  }

function objToStrMap(obj) { // transform obj to map
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k]);
    }
    return strMap;
}

client.on('messageUpdate', async (oldMessage, newMessage) =>{
    if (oldMessage.guild.id != SERVER_ID) return;
    if (oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const embed = new discord.MessageEmbed()
        .addField("Before", oldMessage.content.slice(0, 900), false)
        .addField("After", newMessage.content.slice(0, 900), false)
        .setAuthor(oldMessage.author.tag,oldMessage.author.displayAvatarURL())
        .setDescription(`**Message sent by ${oldMessage.author} edited in ${oldMessage.channel}**`)
        .setColor('BLUE')
        .setTimestamp(new Date())
        .setFooter(`Author ID: ${oldMessage.author.id} | message ID: ${oldMessage.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
  });

client.on('messageDelete', async (message) => {
    if (message.guild.id != SERVER_ID) return;
    if (message.author.bot) return;
    if (message.attachments.size !== 0){
        attachments = '**Attachments:** ';
        message.attachments.forEach( (value) => {
            attachments += value.proxyURL + ' ';
        }
    )}else{attachments = ''};
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send({embed: {
            color: 'ORANGE',
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL()},
            description: `**Message sent by ${message.author} deleted in ${message.channel}**\n${message.content.slice(0,1800)}\n${attachments}`,
            timestamp: new Date(),
            footer: {text: `Author ID: ${message.author.id} | message ID: ${message.id}`}}})
            .catch(console.error))
        .catch(console.error);
})

client.on('guildMemberAdd', async (member) =>{
    if (member.guild.id != SERVER_ID) return;
    const embed = new discord.MessageEmbed()
        .addField("Account Age", calcDate(new Date(), member.user.createdAt))
        .setAuthor(member.user.tag,member.user.displayAvatarURL())
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**${member} joined the server**`)
        .setColor('GREEN')
        .setTimestamp(new Date())
        .setFooter(`User ID: ${member.user.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
});

client.on('guildMemberRemove', async (member) =>{
    if (member.guild.id != SERVER_ID) return;
    const embed = new discord.MessageEmbed()
        .addField("Account Age", calcDate(new Date(), member.user.createdAt))
        .setAuthor(member.user.tag,member.user.displayAvatarURL())
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**${member} left the server**`)
        .setColor('RED')
        .setTimestamp(new Date())
        .setFooter(`User ID: ${member.user.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
});


function calcDate(date1,date2) {
    var diff = Math.floor(date1.getTime() - date2.getTime());
    var seconds = Math.floor(diff/1000);
    var minutes = Math.floor(seconds/60);
    seconds = seconds - minutes*60;
    var hours = Math.floor(minutes/60);
    minutes = minutes - hours*60;    
    var days = Math.floor(hours/24);
    hours = hours - days*24;
    var years = Math.floor(days/365);
    days = days - years*365;
    var months = Math.floor(days/30);
    days = days - months*30;

    message = '';
    if (years) message += `${years} years, `;
    if (months) message += `${months} months, `;
    if (days) message += `${days} days, `;
    if (hours) message += `${hours} hours, `;
    if (minutes) message += `${minutes} minutes, `;
    if (seconds) message += `${seconds} seconds, `;
    return message.slice(0,-2);
};

client.on('guildBanAdd', async(guild, user) => {
    if (guild.id != SERVER_ID) return;
    const embed = new discord.MessageEmbed()
        .setAuthor(user.tag,user.displayAvatarURL())
        .setThumbnail(user.displayAvatarURL())
        .setDescription(`**${user.tag} was banned from the server**`)
        .setColor('WHITE')
        .setTimestamp(new Date())
        .setFooter(`User ID: ${user.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
});

client.on('guildMemberUpdate', async(oldMember, newMember) =>{
    if (oldMember.nickname !== newMember.nickname){
        const embed = new discord.MessageEmbed()
        .addField("Before", oldMember.nickname ? oldMember.nickname : oldMember.user.username, false)
        .addField("After", newMember.nickname ? newMember.nickname : newMember.user.username, false)
        .setAuthor(oldMember.user.tag,oldMember.user.displayAvatarURL())
        .setDescription(`**${oldMember} edited their nickname**`)
        .setColor('PURPLE')
        .setTimestamp(new Date())
        .setFooter(`Author ID: ${oldMember.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
    }

    if (oldMember.roles.cache.has(TIMEOUT_ID) && !newMember.roles.cache.has(TIMEOUT_ID)) {
        const embed = new discord.MessageEmbed()
        .setAuthor(oldMember.user.tag, oldMember.user.displayAvatarURL())
        .setThumbnail(oldMember.user.displayAvatarURL())
        .setDescription(`**${oldMember} was untimed out**`)
        .setColor('BLURPLE')
        .setTimestamp(new Date())
        .setFooter(`User ID: ${oldMember.user.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
    }

    if (newMember.roles.cache.has(TIMEOUT_ID) && !oldMember.roles.cache.has(TIMEOUT_ID)) {
        const embed = new discord.MessageEmbed()
        .setAuthor(oldMember.user.tag, oldMember.user.displayAvatarURL())
        .setThumbnail(oldMember.user.displayAvatarURL())
        .setDescription(`**${oldMember} was timed out**`)
        .setColor('DARK_PURPLE')
        .setTimestamp(new Date())
        .setFooter(`User ID: ${oldMember.user.id}`);
    client.channels.fetch(LOG_CHANNEL)
        .then(channel => channel.send(embed).catch(console.error))
        .catch(console.error);
    }
})