// ==UserScript==
// @name         nnm release helper
// @namespace    nnm helpers
// @description  Заполнение полей по данным со страницы аниме на сайте World-Art
// @version      1.2
// @author       NiackZ
// @homepage     https://github.com/NiackZ/nnm-anime-helper
// @downloadURL  https://github.com/NiackZ/nnm-anime-helper/raw/master/helper.user.js
// @updateURL    https://github.com/NiackZ/nnm-anime-helper/raw/master/helper.user.js
// @match         *://*.nnmclub.to/forum/release.php?what=anime_common*
// @match         *://*.nnm-club.me/forum/release.php?what=anime_common*
// @match         *://*.nnm-club.name/forum/release.php?what=anime_common*
// @match         *://nnmclub2vvjqzjne6q4rrozkkkdmlvnrcsyes2bbkm7e5ut2aproy4id.onion/forum/release.php?what=anime_common*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nnmclub.to
// ==/UserScript==
//

(function() {
    'use strict';
    let animeInfo = null;
    let miInfo = null;
    const defaultTemplate = `$Header$
[align=center][size=24]$Names$[/size][/align]

[img=right]$Poster$[/img]

[b]Страна[/b]: $Country$
[b]Год выпуска[/b]: $Year$
[b]Жанр[/b]: $Genre$
[b]Тип[/b]: $Type$
[b]Продолжительность[/b]: $Count$ эп, $Duration$
[b]Режиссер[/b]: $Director$
[b]Студия[/b]: $Studio$
[b]Информационные ссылки[/b]: [url=$WA_Link$][color=darkred][b]World Art[/b][/color][/url] [b], [/b] [url=$Shikimori_Link$][color=darkred][b]Shikimori[/b][/color][/url] [b], [/b] [url=$MAL_Link$][color=darkred][b]MyAnimeList[/b][/color][/url] [b], [/b] [url=$AniDb_Link$][color=darkred][b]AniDB[/b][/color][/url]

[b]Описание[/b]: $Description$

[b]Субтитры[/b]:
_USERSUBS [b]#{index}[/b]: {language}, {format}, [color=blue]{title}[/color] USERSUBS_

[b]Качество[/b]: $Quality$ [$Reaper$]
[b]Формат видео[/b]: $Video_ext$
[b]Видео[/b]: [color=red]$Video_codec$[/color], $Video_width$x$Video_height$ ($Video_aspect$), $Video_bit_rate$, $Video_fps$ fps, [color=red]$Video_bit_depth$bit[/color]
[b]Аудио[/b]:
_USERAUDIO [b]#{index}[/b]: [img=1em]{flag}[/img] {language}, {codec}, {bitRate}, {sampleRate}, {channels} канала - [color=blue]{title}[/color] USERAUDIO_

[spoiler="Подробные тех. данные"][pre]$MediaInfo$[/pre][/spoiler]

[spoiler="Список эпизодов"]
$Episodes$
[/spoiler]

[spoiler="Скриншоты"]
$Screenshots$
[/spoiler]`;
    const localStorageName = 'animeTemplate';
    const episodeType = {
        TV: 'TV',
        SP: 'Special'
    }
    const LANG = {
        RUS: "Русский",
        ENG: "Английский",
        CHI: "Китайский",
        KAZ: "Казахский",
        JAP: "Японский"
    }
    if (localStorage.getItem(localStorageName) === null) {
        localStorage.setItem(localStorageName, defaultTemplate);
    }
    const table = {};
    const cells = document.querySelectorAll('td.row1[align="right"]');
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const name = cell.innerText.split(":")[0].trim();
        let input = cell.parentNode.querySelector('td.row2 input');
        if (!input) input = cell.parentNode.querySelector('td.row2 textarea');
        if (!input) input = cell.parentNode.querySelectorAll('td.row2 select');
        table[name] = {'label': cell, 'input': input};
    }
    console.log(table);
    const addUrlRow = () => {
        const table = document.querySelector('#releaseForm table')
        if (!table) return;
        const newRow = table.insertRow(3);

        const titleCell = newRow.insertCell(0);
        titleCell.className = 'row1';
        titleCell.innerText = 'Ссылка на аниме:';
        titleCell.align = 'right';
        titleCell.vAlign = 'top';
        titleCell.width = '170';
        titleCell.appendChild(createNewScriptSpan());

        const inputsCell = newRow.insertCell(1);
        inputsCell.className = 'row2';

        const textField = document.createElement('input');
        textField.type = 'text';
        textField.id = 'titleLink';
        textField.style.marginBottom = '5px';
        textField.size = 70;
        inputsCell.appendChild(textField);

        const freeEl = document.createElement('span');
        freeEl.innerText = 'URL';
        freeEl.style.margin = '0 5px';
        inputsCell.appendChild(freeEl);

        const fillButton = document.createElement('input');
        fillButton.type = 'button';
        fillButton.style.width = '100px';
        fillButton.value = 'Заполнить';
        fillButton.onclick = async function() {
            try {
                fillButton.disabled = true;
                const link = document.getElementById('titleLink').value;
                if (!link) {
                    alert("Вставьте ссылку с сайта world-art");
                }
                else {
                    animeInfo = null;
                    const response = await fetchData(link);
                    if (!!response?.anime) {
                        animeInfo = response.anime;
                        fillFields(response.anime);
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                fillButton.disabled = false;
            }

        };

        inputsCell.appendChild(fillButton);
        inputsCell.appendChild(document.createElement('br'));

        const infoSpan = document.createElement('span');

        const textNode = document.createTextNode('Вставьте ссылку с сайта ');
        infoSpan.appendChild(textNode);

        const link = document.createElement('a');
        link.href = 'http://world-art.ru';
        link.innerText = 'world-art';
        link.target = '_blank';

        infoSpan.appendChild(link);
        inputsCell.appendChild(infoSpan);
    }
    const fetchData = async (link, apiEndpoint = '/get/anime/info') => {
        const cyclicUrl = 'https://elated-cummerbund-eel.cyclic.app';
        try {
            const response = await fetch(`${cyclicUrl}${apiEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ link }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при получении данных.  ` + response);
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка: ', error.message);
        }
    }
    const fillFields = (anime) => {
        console.log(anime);
        table['Оригинальное название'].input.value = anime.names.kanji ? anime.names.kanji : "";
        table['Название латиницей'].input.value = anime.names.romaji ? anime.names.romaji : "";
        table['Английское название'].input.value = anime.names.en ? anime.names.en : "";
        table['Русское название'].input.value = anime.names.ru ? anime.names.ru.replace('[', '(').replace(']', ')') : "";
        table['Год выпуска'].input.value = anime.season.year ? anime.season.year : "";
        setOptionIfExists(table['Тип'].input[0], anime.type.shortType);
        table['Жанр'].input.value = anime.genres ? anime.genres : "";
        if (anime.type.duration && anime.type.episodes) {
            if (Number(anime.type.episodes) === 1) {
                table['Продолжительность'].input.value = anime.type.duration;
            }
            else {
                table['Продолжительность'].input.value = `${anime.type.episodes} эп. по ${anime.type.duration}`;
                table['Количество серий'].input.value = `${anime.type.episodes} из ${anime.type.episodes}`;
            }
        }
        table['Дата выпуска'].input.value = anime.release ? anime.release : "";
        table['Производство'].input.value = anime.studios ? anime.studios.map(st => st.name).join(', ') : "";
        table['Режиссер'].input.value = anime.director ? anime.director : "";
        table['Ссылки'].input.value = document.getElementById('titleLink').value;
        table['Описание'].input.value = anime.description ? anime.description : "";
        if (!!anime.episodes) {
            const episodesArray = anime.episodes.map((episode, index) => {
                if (episode.type === episodeType.TV) {
                    return `${index + 1}. ${episode.name}`;
                } else {
                    return `${index + 1}. ${episode.name} (${episode.type})`;
                }
            });
            table['Эпизоды'].input.value = episodesArray.join('\n');
        }
    }
    const addTechButton = () => {
        table['MediaInfo'].label.appendChild(document.createElement('br'));
        const fillButton = document.createElement('input');
        fillButton.type = 'button';
        fillButton.style.width = '160px';
        fillButton.style.fontSize = '12px';
        fillButton.value = 'Заполнить тех. данные';
        fillButton.onclick = function() {
            try{
                miInfo = null;
                const techData = getTechData();
                miInfo = techData;
                console.log(techData);
                if (techData) {
                    table['Характеристики видео(для заголовка)'].input.value =
                        miInfo.videoInfo.bitDepth == 10
                            ? `${miInfo.videoInfo.height}p ${miInfo.videoInfo.bitDepth}-bit`
                            : `${miInfo.videoInfo.height}p`;
                    table['Видео'].input.value =
                        `${miInfo.videoInfo.codec}, ${miInfo.videoInfo.width}x${miInfo.videoInfo.height} (${miInfo.videoInfo.aspect}), ~${miInfo.videoInfo.fps} fps, ${miInfo.videoInfo.bitRate}`;

                    const jpAudio = miInfo.audioInfo.int.find(audio => audio.language.toLowerCase() === "японский");
                    const ruAudio = miInfo.audioInfo.int.find(audio => audio.language.toLowerCase() === "русский");
                    const selectedAudio = jpAudio || ruAudio;
                    table['Аудио'].input.value = `${selectedAudio.codec}, ${selectedAudio.channels} ch, ${selectedAudio.sampleRate}, ${selectedAudio.bitRate}`;
                    let audioValue = "";
                    let audioValHeader = "";
                    if (jpAudio && ruAudio) {
                        audioValue = "Японский и русский";
                        audioValHeader = "raw+rus";
                    } else if (jpAudio) {
                        audioValue = "Японский";
                        audioValHeader = "raw";
                    } else if (ruAudio) {
                        audioValue = "Русский";
                        audioValHeader = "rus";
                    }
                    setOptionIfExists(table['Язык озвучки'].input[0], audioValue);
                    setOptionIfExists(table['Язык озвучки(для заголовка)'].input[0], audioValHeader);
                    const ruSubs = miInfo.textInfo.some(sub => sub.language.toLowerCase() === "русский");
                    if (ruSubs) {
                        setOptionIfExists(table['Субтитры'].input[0], "Русские");
                    }
                }
            }
            catch (error) {
                console.error('Ошибка: ', error.message);
            }
        };
        table['MediaInfo'].label.appendChild(fillButton);
    }
    const getTechData = () => {
        const textareaElement = table['MediaInfo'].input;
        return textareaElement.value ? MiParser(textareaElement.value) : null;
    }
    const MiParser = (miData) => {
        const RU = 'RU';
        const EN = 'EN';
        const REGEX_EN = {
            CODEC: /Format\s+:\s+([^\r\n]+)/,
            CODEC_PROFILE: /Format profile\s+:\s+([^\r\n]+)/,
            BIT_RATE: /Bit rate\s+:\s+([^\r\n]+)/,
            WIDTH: /Width\s+:\s+(\d+(?:\s+\d*)?)/,
            HEIGHT: /Height\s+:\s+(\d+(?:\s+\d*)?)/,
            ASPECT: /Display aspect ratio\s+:\s+([^\r\n]+)/,
            FRAME_RATE: /Frame rate\s+:\s+([^\r\n]+)/,
            CHROMA_SUBSAMPLING: /Chroma subsampling\s+:\s+([^\r\n]+)/,
            COLOR_PRIMARIES: /Color primaries\s+:\s+([^\r\n]+)/,
            BIT_DEPTH: /Bit depth\s+:\s+(\d+)/,
            CHANNELS: /Channel\(s\)\s+:\s+(\d+)/,
            SAMPLING_RATE: /Sampling rate\s+:\s+(.+)/,
            LANGUAGE: /Language\s+:\s+(.+)/,
            TITLE: /Title\s+:\s+(.+)/,
            NAME: /Complete name\s+:\s+([^\r\n]+)/
        };
        const REGEX_RU = {
            CODEC: /Формат\s+:\s+([^\r\n]+)/,
            CODEC_PROFILE: /Профиль формата\s+:\s+([^\r\n]+)/,
            BIT_RATE: /Битрейт\s+:\s+([^\r\n]+)/,
            WIDTH: /Ширина\s+:\s+(\d+(?:\s+\d*)?)/,
            HEIGHT: /Высота\s+:\s+(\d+(?:\s+\d*)?)/,
            ASPECT: /Соотношение сторон\s+:\s+([^\r\n]+)/,
            FRAME_RATE: /Частота кадров\s+:\s+([^\r\n]+)/,
            CHROMA_SUBSAMPLING: /Субдискретизация насыщенности\s+:\s+([^\r\n]+)/,
            COLOR_PRIMARIES: /Основные цвета\s+:\s+([^\r\n]+)/,
            BIT_DEPTH: /Битовая глубина\s+:\s+(\d+)/,
            CHANNELS: /Каналы\s+:\s+(\d+)/,
            SAMPLING_RATE: /Частота\s+:\s+(.+)/,
            LANGUAGE: /Язык\s+:\s+(.+)/,
            TITLE: /Заголовок\s+:\s+(.+)/,
            NAME: /Полное имя\s+:\s+([^\r\n]+)/
        };

        const parseField = (block, regex) => {
            const match = block.match(regex);
            return match ? match[1].trim() : null;
        };
        const translateLanguage = (lang) => {
            if (lang) {
                switch (lang.toLowerCase()) {
                    case "russian":
                        return LANG.RUS;
                    case "japanese":
                        return LANG.JAP;
                    case "english":
                        return LANG.ENG;
                    default:
                        return lang;
                }
            }
            return null;
        }
        const getFileExt = (generalBlockMatch, lang) => {
            if (generalBlockMatch) {
                const generalBlock = generalBlockMatch[1].trim();
                const fileName = parseField(generalBlock, lang === EN ? REGEX_EN.NAME: REGEX_RU.NAME);
                return fileName.split('.').pop().toUpperCase();
            }
            return null;
        }
        const getVideoInfo = (videoBlockMatch, lang) => {
            if (videoBlockMatch) {
                const parseVideoBlock = (videoBlock, regex) => {
                    const _width = parseField(videoBlock, regex.WIDTH);
                    const _height = parseField(videoBlock, regex.HEIGHT);
                    const _fps = parseField(videoBlock, regex.FRAME_RATE);

                    return {
                        codec: parseField(videoBlock, regex.CODEC),
                        codecProfile: parseField(videoBlock, regex.CODEC_PROFILE),
                        width: _width ? _width.replaceAll(" ", "") : null,
                        height: _height ? _height.replaceAll(" ", "") : null,
                        aspect: parseField(videoBlock, regex.ASPECT),
                        fps: _fps ? _fps?.replaceAll(',', '.')?.split(" ")[0] : null,
                        chromaSubsampling: parseField(videoBlock, regex.CHROMA_SUBSAMPLING),
                        colorPrimaries: parseField(videoBlock, regex.COLOR_PRIMARIES),
                        bitDepth: parseField(videoBlock, regex.BIT_DEPTH),
                        bitRate: parseField(videoBlock, regex.BIT_RATE)?.replaceAll(',', '.'),
                        fileExt: null
                    };
                }

                return parseVideoBlock(videoBlockMatch[1].trim(), lang === EN ? REGEX_EN : REGEX_RU);
            }

            return null;
        }
        const getAudioInfo = (blocks, lang) => {
            if (blocks) {
                const parseAudioBlock = (blocks, regex) => {
                    return Array.from(blocks).map(audioBlockMatch => {
                        const audioBlock = audioBlockMatch[1].trim();
                        return {
                            language: translateLanguage(parseField(audioBlock, regex.LANGUAGE)),
                            codec: parseField(audioBlock, regex.CODEC),
                            bitRate: parseField(audioBlock, regex.BIT_RATE),
                            sampleRate: parseField(audioBlock, regex.SAMPLING_RATE)?.replaceAll(',', '.'),
                            bitDepth: parseField(audioBlock, regex.BIT_DEPTH),
                            channels: parseField(audioBlock, regex.CHANNELS),
                            title: parseField(audioBlock, regex.TITLE)
                        }
                    });
                }
                return parseAudioBlock(blocks, lang === EN ? REGEX_EN : REGEX_RU);
            }
            return null;
        }
        const getTextInfo = (blocks, lang) => {
            if (blocks) {
                const parseTextBlock = (blocks, regex) => {
                    return Array.from(blocks).map(textBlockMatch => {
                        const textBlock = textBlockMatch[1].trim();
                        return {
                            language: translateLanguage(parseField(textBlock, regex.LANGUAGE)),
                            format: parseField(textBlock, regex.CODEC),
                            title: parseField(textBlock, regex.TITLE)
                        }
                    });
                }

                return parseTextBlock(blocks, lang === EN ? REGEX_EN : REGEX_RU);
            }
            return null;
        }

        const getRegexBlocks = {
            VIDEO: /Video([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            VIDEO_RU: /Видео([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            AUDIO: /Audio([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            AUDIO_RU: /Аудио([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            AUDIO_EXT: /Audio([\s\S]+?)(?=Audio|$)/g,
            AUDIO_RU_EXT: /Аудио([\s\S]*?)(?=Аудио|$)/g,
            TEXT: /Text([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            TEXT_RU: /Текст([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/g,
            GENERAL: /General([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/,
            GENERAL_RU: /Общее([\s\S]+?)(?=(\n\n|\r\n\r\n|$))/
        }

        const videoBlockMatch = miData.match(getRegexBlocks.VIDEO);
        const audioBlockMatches = miData.matchAll(getRegexBlocks.AUDIO);
        const textBlockMatches = miData.matchAll(getRegexBlocks.TEXT);
        const generalBlockMatch = miData.match(getRegexBlocks.GENERAL);

        const videoBlockMatch_RU = miData.match(getRegexBlocks.VIDEO_RU);
        const audioBlockMatches_RU = miData.matchAll(getRegexBlocks.AUDIO_RU);
        const textBlockMatches_RU = miData.matchAll(getRegexBlocks.TEXT_RU);
        const generalBlockMatch_RU = miData.match(getRegexBlocks.GENERAL_RU);

        const useEN = videoBlockMatch_RU === null &&
            Array.from(audioBlockMatches_RU).length === 0 &&
            Array.from(textBlockMatches_RU).length === 0 &&
            generalBlockMatch_RU === null;

        const lang = useEN ? EN : RU;

        const videoInfo = getVideoInfo(useEN ? videoBlockMatch : videoBlockMatch_RU, lang);
        const audioInfo = {
            int: null, ext: null
        }
        const textAreaExt = document.getElementById('ext_audio_area')?.value;
        if (!valueIsEmpty(textAreaExt)) {
            const audioExtBlockMatches = [...textAreaExt.matchAll(getRegexBlocks.AUDIO_EXT)];
            const audioExtBlockMatches_RU = [...textAreaExt.matchAll(getRegexBlocks.AUDIO_RU_EXT)];
            audioInfo.ext = audioExtBlockMatches_RU.length === 0
                ? getAudioInfo(audioExtBlockMatches, EN)
                : getAudioInfo(audioExtBlockMatches_RU, RU);
        }

        audioInfo.int = getAudioInfo(useEN ? audioBlockMatches : audioBlockMatches_RU, lang);
        const textInfo = getTextInfo(useEN ? textBlockMatches : textBlockMatches_RU, lang);
        if (videoInfo !== null) {
            videoInfo.fileExt = getFileExt(useEN ? generalBlockMatch : generalBlockMatch_RU, lang);
        }

        return { videoInfo, audioInfo, textInfo };
    }
    const valueIsEmpty = (value) => {
        return value === null || value === undefined || value === "";
    }
    const setOptionIfExists = (select, value) => {
        const selectedOption = Array.from(select.options).find(option => option.textContent.trim().toLowerCase() === value.toLowerCase());
        if (selectedOption) {
            selectedOption.setAttribute('selected', 'selected');
        }
    }
    const createNewScriptSpan = () => {
        const scriptField = document.createElement('span');
        scriptField.style.display = 'block';
        scriptField.style.color = 'gray'
        scriptField.style.fontStyle = 'italic';
        scriptField.style.fontSize = 'smaller';
        scriptField.innerText = '(script row)';
        return scriptField;
    }
    const init = () => {
        addUrlRow();
        addTechButton();
    }

    init();

})();