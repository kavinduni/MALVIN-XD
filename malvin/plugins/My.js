const { fetchJson } = require('../functions');
const config = require('../../settings');
const { cmd } = require('../command');
const { SinhalaSub } = require('@sl-code-lords/movie-api');
const { PixaldrainDL } = require("pixaldrain-sinhalasub");
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

//--------------------------- Sinhalasub ------------------------------//


cmd({
    pattern: "sinhalasub",
    desc: "Search for a movie and get details and download options.",
    alias: ["sinhalasubdl"],
    category: "movie",
    react: "🍿",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const input = q.trim();
        if (!input) return reply("Please provide a movie name to search.");
        
        // Step 1: Search for the movie
        const result = await SinhalaSub.get_list.by_search(input);
        if (!result.status || result.results.length === 0) return reply("No results found.");

        let message = "📺 Rowdy Md Search Results for\n\n*🔢 Reply Below Number*\n\n";
        result.results.forEach((item, index) => {
            message += `${index + 1}. *${item.title}*\n🗓️Type : *${item.type}*\n📎 Link : ${item.link}\n\n`;
        });

        // Step 2: Send search results with an image (thumbnail)
        const sentMsg = await conn.sendMessage(from, {
            image: { url: 'https://i.ibb.co/zZ13BVL/9674.jpg' },
            caption: message,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: ' 𝐌𝐃',
                    newsletterJid: "120363322195409882@newsletter",
                },
                externalAdReply: {
                    title: ' 𝐌𝐃 𝐖𝐀 𝐁𝐎𝐓💚',
                    body: 'ᴀ ʀᴏᴡᴅʏ ᴍᴅ ᴡᴀ ʙᴏᴛ ʙᴇꜱᴇᴅ ᴏɴ ʙᴀɪʏʟᴇꜱ',
                    mediaType: 1,
                    sourceUrl: "",
                    thumbnailUrl: 'https://i.ibb.co/zZ13BVL/9674.jpg',
                    renderLargerThumbnail: false,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        // Step 3: Wait for the user to select a movie by number
        const messageListener = async (update) => {
            const message = update.messages[0];
            if (!message.message || !message.message.extendedTextMessage) return;

            const userReply = message.message.extendedTextMessage.text.trim();
            const selectedMovieIndex = parseInt(userReply) - 1;

            if (selectedMovieIndex < 0 || selectedMovieIndex >= result.results.length) {
                await conn.sendMessage(from, {
                    react: { text: '❌', key: mek.key }
                });
                return reply("Invalid selection. Please choose a valid number from the search results.");
            }

            const selectedMovie = result.results[selectedMovieIndex];
            const link = selectedMovie.link;

            // Step 4: Fetch movie details from the selected movie's link
            const movieDetails = await SinhalaSub.movie(link);
            if (!movieDetails || !movieDetails.status || !movieDetails.result) {
                return reply("Movie details not found or invalid link provided.");
            }

            const movie = movieDetails.result;
            let movieMessage = `☘️ *${movie.title}*\n\n`;
            movieMessage += `*🧿 Release Date:* ${movie.release_date}\n\n`;
            movieMessage += `*🌍 Country:* ${movie.country}\n\n`;
            movieMessage += `*⏱️ Duration:* ${movie.duration}\n\n`;
            movieMessage += `*🎀 Categories:* ${movie.genres}\n\n`;
            movieMessage += `*⭐ IMDB:* ${movie.IMDb_Rating}\n\n`;
            movieMessage += `*🤵‍♂️ Director:* ${movie.director.name}\n\n`;
            movieMessage += `*🔢 Reply Below Number*\n\n`;
            movieMessage += `1 | 480p\n`;
            movieMessage += `2 | 720p\n`;
            movieMessage += `3 | 1080p\n\n`;
            movieMessage += `*💚 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐑 𝐃𝐀𝐊𝐒𝐇𝐈𝐍𝐀 💚*`;

            const imageUrl = movie.images && movie.images.length > 0 ? movie.images[0] : '';

            // Step 5: Send movie details with download options
            const movieDetailsMessage = await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption: movieMessage
            });

            // Step 6: Remove the message listener to prevent re-sending of the movie message
            conn.ev.off("messages.upsert", messageListener);

            // Step 7: Listener for user's quality selection
            const qualityListener = async (update) => {
                const message = update.messages[0];
                if (!message.message || !message.message.extendedTextMessage) return;

                const userReply = message.message.extendedTextMessage.text.trim();

                if (message.message.extendedTextMessage.contextInfo.stanzaId === movieDetailsMessage.key.id) {
                    let quality;
                    if (userReply === '1') quality = "SD 480p";
                    else if (userReply === '2') quality = "HD 720p";
                    else if (userReply === '3') quality = "FHD 1080p";
                    else {
                        await conn.sendMessage(from, {
                            react: { text: '❌', key: mek.key }
                        });
                        return reply("Invalid option. Please select from SD, HD, or FHD.");
                    }

                    try {
                        // Assuming PixaldrainDL is the function that retrieves the direct download link
                        const directLink = await PixaldrainDL(link, quality, "direct");
                        if (directLink) {
                const sentMsg = await conn.sendMessage(from, {
                                document: { url: directLink },
                                mimetype: 'video/mp4',
                                fileName: `🍿ʀᴏᴡᴅʏ ᴍᴏᴠɪᴇ ᴜᴘʟᴏᴅᴇʀ.mp4`,
                                caption: `${movie.title}\n\n*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍʀ ᴅᴀᴋꜱʜɪɴᴀ*`,
                 contextInfo: {
                forwardingScore: 999,
                isForwarded: false,
                forwardedNewsletterMessageInfo: {
                    newsletterName: '𝐑𝐎𝐖𝐃𝐘 𝐌𝐃',
                    newsletterJid: "120363322195409882@newsletter",
                },
                externalAdReply: {
                    title: '𝐑𝐎𝐖𝐃𝐔 𝐌𝐃 𝐖𝐀 𝐁𝐎𝐓💛',
                    body: 'ᴀ ʀᴏᴡᴅʏ ᴍᴅ ᴡᴀ ʙᴏᴛ ʙᴇꜱᴇᴅ ᴏɴ ʙᴀɪʏʟᴇꜱ',
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029Vb30SSF3wtb1aK7ZGa3u",
                    thumbnailUrl: 'https://i.ibb.co/zZ13BVL/9674.jpg',
                    renderLargerThumbnail: false,
                    showAdAttribution: true
                }
            }
       });
                            // React with success
                            await conn.sendMessage(from, {
                                react: { text: '✅', key: mek.key }
                            });
                        } else {
                            await conn.sendMessage(from, {
                                react: { text: '❌', key: mek.key }
                            });
                            return reply(`Could not find the ${quality} download link. Please try another quality.`);
                        }
                    } catch (err) {
                        console.error('Error in PixaldrainDL function:', err);
                        await conn.sendMessage(from, {
                            react: { text: '❌', key: mek.key }
                        });
                        return reply("An error occurred while processing your download request.");
                    }
                }
            };

            // Register quality listener
            conn.ev.on("messages.upsert", qualityListener);

            // Clean up listener after 60 seconds to prevent memory leaks
            setTimeout(() => {
                conn.ev.off("messages.upsert", qualityListener);
            }, 200000);
        };

        // Register movie selection listener
        conn.ev.on("messages.upsert", messageListener);

        // Clean up after 60 seconds to prevent memory leaks
        setTimeout(() => {
            conn.ev.off("messages.upsert", messageListener);
        }, 200000);

    } catch (error) {
        console.error('Error in movie search or details:', error);
        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });
        reply("An error occurred while fetching the movie search or details.");
    }
});
