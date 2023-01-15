//모듈 불러오는 코드
const { Client, Intents, Collection, Interaction } = require("discord.js");
const client = new Client({ intents: 32767 });
const fs = require("fs");
const { prefix, token } = require("D:/Code/Discordbot/Moon99/config.json");
const { DiscordTogether } = require("discord-together");
client.discordTogether = new DiscordTogether(client);
const mongoose = require("mongoose");
const { Module } = require("module");
const { exec } = require("child_process");
module.exports = client;
client.commands = new Collection();
client.slashcommands = new Collection();

//몽고디비 연결코드
mongoose
  .connect(
    "mongodb+srv://Moon0119:1031a!0119@cluster0.xqmpjkt.mongodb.net/?retryWrites=true&w=majority",
    {}
  )
  .then(console.log("MongoDB 데이터베이스에 연결했습니다"));

let commands = [];
const commandsFile = fs
  .readdirSync("./slashcommands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandsFile) {
  const command = require(`./slashcommands${file}`);
  client.slashcommands.set(command.name, command);
  commands.push({ name: command.name, description: command.description });
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.slashcommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply(
      new discord.MessageEmbed()
        .setTitle("오류가 발생했습니다")
        .setDescription("오류가 발생하였습니다.신속한 조치 취하도록 하겠습니다")
    );
  }
});

//상메지정,console.log 준비메세지 코드
client.once("ready", () => {
  let number = 0;
  setInterval(() => {
    const list = [`${client.guilds.cache.size}개의 서버에서 일`];
    if (number == list.length) number = 0;
    client.user.setActivity(list[number], {
      type: "PLAYING",
    });
    number++;
  }, 5000);
  console.log("봇이 준비되었습니다");
});

//커맨드 핸들러2(접두사 핸들링)
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift();
  const command = client.commands.get(commandName);
  if (!command) return;
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
  }
});

//커맨드파일 위치 정의 코드2
for (const file of commandsFile) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

//오류난 금지어
client.on("messageCreate", (message) => {
  if (message.channel.type == "DM") return;
  const Schema = require("D:/Code/Discordbot/Moon99/models/금지어");
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  if (args[1] == "추가" || args[1] == "삭제") return;
  Schema.find({ serverid: message.guild.id }).exec((err, res) => {
    for (let i = 0; i < res.length; i++) {
      if (message.content.includes(res[i].금지어)) {
        if (res[i].온오프 == "on") {
          message.delete();
          const embed = new (require("discord.js").MessageEmbed)()
            .setTitle("메세지 검사 시스템")
            .setDescription(
              `${message.content}에서 금지어가 감지되었습니다.
            금지어는 자동 삭제됩니다`
            )
            .addField("감지된 금지어", `${res[i].금지어}`);
          setTimestamp();
          message.channel.send({ embeds: [embed] }).then((msg) => {
            setTimeout(() => {
              msg.delete();
            }, 5000);
          });
        }
      }
    }
  });
});

//오류난 음챗생성
client.on("voiceStateUpdate", async (newState, oldState) => {
  const channel = newState.guild.channels.cache.find(
    (c) => c.name === "음성채널생성"
  );
  if (newState.member.voice.channel) {
    if (!channel) return;
    if (newState.member.voice.channel.id !== channel.id) return;
    newState.guild.channels
      .create(`${newState.member.user.username}의 음성방`, {
        type: "GUILD_VOICE",
        parent: oldState.channel.parent,
      })
      .then((ch) => {
        if (!ch) return;
        newState.member.voice.setChannel(ch);
        const interval = setInterval(() => {
          if (ch.deleted == true) {
            clearInterval(interval);
            return;
          }
          if (ch.members.size == 0) {
            ch.delete();
            console.log("채널 삭제됨");
            return;
          }
        }, 5000);
      });
  }
});

//로그인
client.login(
  "MTAzNTg2NTk3ODIxNjY2MTAxMg.GroqQ4.RD8wdwcWp9ZWgrlkBUP33Xh2puPDE6caB0fJV4"
);
