// ==UserScript==
// @name         nnm release helper
// @namespace    nnm helpers
// @description  Заполнение полей по данным со страницы аниме на сайте World-Art
// @version      1.7
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
    const TAG = {
        header: '$Header$',
        names: '$Names$',
        namesString: '$String_names$',
        country: '$Country$',
        year: '$Year$',
        season: '$Season$',
        genre: '$Genre$',
        type: '$Type$',
        episodeCount: '$Count$',
        episodeDuration: '$Duration$',
        director: '$Director$',
        studio: '$Studio$',
        studioNames: '$Studio_names$',
        description: '$Description$',
        episodes: '$Episodes$',
        release: '$Release$',
        LINK: {
            WA: '$WA_Link$',
            Shikimori: '$Shikimori_Link$',
            MAL: '$MAL_Link$',
            AniDb: '$AniDb_Link$',
            ANN: '$ANN_Link$',
        },
        VIDEO: {
            ext: '$Video_ext$',
            height: '$Video_height$',
            width: '$Video_width$',
            codec: '$Video_codec$',
            codecProfile: '$Video_codec_profile$',
            aspect: '$Video_aspect$',
            bitrate: '$Video_bit_rate$',
            fps: '$Video_fps$',
            bitDepth: '$Video_bit_depth$',
            chromaSubsampling: '$Video_chroma_subsampling$',
            colorPrimaries: '$Video_color_primaries$'
        },
        FORM: {
            quality: '$Quality$',
            reaper: '$Reaper$',
            poster: '$Poster$',
            screenshots: '$Screenshots$',
            MI: '$MediaInfo$'
        },
        AUDIO: {
            start: '_USERAUDIO',
            end: 'USERAUDIO_',
        },
        SUB: {
            start: '_USERSUBS',
            end: 'USERSUBS_'
        },
        TEMPLATE: {
            index: '{index}',
            language: '{language}',
            flag: '{flag}',
            codec: '{codec}',
            bitRate: '{bitRate}',
            sampleRate: '{sampleRate}',
            bitDepth: '{bitDepth}',
            channels: '{channels}',
            title: '{title}',
            format: '{format}',
            type: '{type}'
        }
    }
    if (localStorage.getItem(localStorageName) === null) {
        localStorage.setItem(localStorageName, defaultTemplate);
    }
    const table = {};
    const cells = document.querySelectorAll('td.row1[align="right"]');
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const name = cell.innerText.split(":")[0].trim();
        let input = cell.parentNode.querySelector('td.row2 input:not([type=button])');
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
                        response.anime.release = response.anime?.release?.replaceAll("  ", " ");
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
                const episodeNumber = (index + 1).toString().padStart(2, '0'); // Добавляем ведущие нули
                if (episode.type === episodeType.TV) {
                    return `${episodeNumber}. ${episode.name}`;
                } else {
                    return `${episodeNumber}. ${episode.name} (${episode.type})`;
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
                    let videoHeader = `${miInfo.videoInfo.height}p`;
                    if (miInfo.videoInfo.codec !== "AVC") {
                        videoHeader += ` ${miInfo.videoInfo.codec}`;
                    }
                    if (miInfo.videoInfo.bitDepth != 8) {
                        videoHeader += ` ${miInfo.videoInfo.bitDepth}-bit`;
                    }
                    table['Характеристики видео(для заголовка)'].input.value = videoHeader

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
    const addReaperField = () => {
        const td = table['Видео'].input.parentNode;
        td.appendChild(document.createElement('br'));

        const textField = document.createElement('input');
        textField.type = 'text';
        textField.id = 'reaperField';
        textField.style.marginBottom = '5px';
        textField.size = 70;
        td.appendChild(textField);

        const freeEl = document.createElement('span');
        freeEl.innerText = ' — Автор рипа';
        freeEl.style.margin = '0 5px';
        td.appendChild(freeEl);
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
    const addTemplateRow = () => {
        const table = document.querySelector('#releaseForm table')
        if (!table) return;
        const newRow = table.insertRow(3);
        newRow.className = 'row1'

        const actionCell = newRow.insertCell(0);
        actionCell.colSpan = 2;
        actionCell.style.textAlign = 'center';
        actionCell.style.padding = '5px';

        const setTemplateButton = document.createElement('input');
        setTemplateButton.id = 'setTemplateButton';
        setTemplateButton.type = 'button';
        setTemplateButton.style.padding = '5px';
        setTemplateButton.style.margin = '2px 5px';
        setTemplateButton.style.fontSize = '9pt'
        setTemplateButton.style.cursor = 'pointer';
        setTemplateButton.value = 'Настроить шаблон';

        const calcTemplateButton = document.createElement('input');
        calcTemplateButton.id = 'calcTemplateButton';
        calcTemplateButton.type = 'button';
        calcTemplateButton.style.padding = '5px';
        calcTemplateButton.style.margin = '2px 5px';
        calcTemplateButton.style.fontSize = '9pt'
        calcTemplateButton.style.cursor = 'pointer';
        calcTemplateButton.value = 'Сгенерировать описание';
        calcTemplateButton.onclick = async () => {
            const code = generate(localStorage.getItem(localStorageName));
            if (code) {
                await navigator.clipboard.writeText(code);
                console.info(code);
                showNotification('Сгенерированное описание скопировано в буфер обмена');
            }
        };

        actionCell.appendChild(setTemplateButton);
        actionCell.appendChild(calcTemplateButton);
    }

    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '30px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px';
        notification.style.backgroundColor = 'green';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.opacity = '0'; // Устанавливаем начальную прозрачность
        notification.style.transition = 'opacity 0.1s ease-in-out'; // Добавляем анимацию
        notification.style.zIndex = '999';
        document.body.appendChild(notification);

        setTimeout(function () {
            notification.style.opacity = '1';
        }, 100);

        setTimeout(function () {
            notification.style.opacity = '0';

            setTimeout(function () {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    const createModal = () => {

        const modalContainer = document.createElement('div');
        modalContainer.style.display = 'none';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.zIndex = '999'

        const modalContent = document.createElement('div');
        modalContent.id = "templateModal";
        modalContent.style.boxShadow = '0 0 10px 1px black'
        modalContent.style.background = '#fff';
        modalContent.style.width = '1200px';
        modalContent.style.minHeight = '400px';
        modalContent.style.height = '80%';
        modalContent.style.overflow = 'auto';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.position = 'relative';

        const modalTitle = document.createElement('h1');
        modalTitle.textContent = 'Шаблон';
        modalTitle.style.marginBottom = '10px';
        modalTitle.style.textAlign = 'center';
        modalContent.appendChild(modalTitle);
        const tagColor = 'rgb(144, 36, 255)';

        const infoContainer = document.createElement('div');
        infoContainer.style.margin = '15px 0';
        infoContainer.style.fontSize = '12pt';
        infoContainer.innerHTML = `
        <b style="color: ${tagColor};">${TAG.header}</b> — заголовок релиза с краткой технической информацией;<br>
        <b style="color: ${tagColor};">${TAG.names}</b> — названия аниме, каждое название с новой строки <b style="color: ${tagColor};">${TAG.namesString}</b> — названия аниме, выводятся все в одну строку;<br>
        <b style="color: ${tagColor};">${TAG.country}</b> — страна; <br>
        <b style="color: ${tagColor};">${TAG.year}</b> — год выпуска; <b style="color: ${tagColor};">${TAG.season}</b> — сезон;<br>
        <b style="color: ${tagColor};">${TAG.genre}</b> — жанр; <b style="color: ${tagColor};">${TAG.type}</b> — тип;<br>
        <b style="color: ${tagColor};">${TAG.episodeCount}</b> — количество эпизодов; <b style="color: ${tagColor};">${TAG.episodeDuration}</b> — длительность;<br>
        <b style="color: ${tagColor};">${TAG.director}</b> — режиссер;<br>
        <b style="color: ${tagColor};">${TAG.studio}</b> — названия студий со ссылкой в BB формате; <b style="color: ${tagColor};">${TAG.studioNames}</b> — названия студий;<br>
        <b style="color: ${tagColor};">${TAG.description}</b> — описание;<br>
        <b style="color: ${tagColor};">${TAG.episodes}</b> — список эпизодов;<br>
        <b style="color: ${tagColor};">${TAG.LINK.WA}</b> — ссылка на WA; <b style="color: ${tagColor};">${TAG.LINK.Shikimori}</b> — ссылка на Shikimori; <b style="color: ${tagColor};">${TAG.LINK.AniDb}</b> — ссылка на AniDb;<br>
        <b style="color: ${tagColor};">${TAG.LINK.MAL}</b> — ссылка на MAL; <b style="color: ${tagColor};">${TAG.LINK.ANN}</b> — ссылка на ANN;<br>
        <br>
        Если поле "Подробные тех. данные" заполнено MediaInfo информацией, то заполняются следующие поля;<br>
        <b style="color: ${tagColor};">${TAG.VIDEO.ext}</b> — формат видео;  <b style="color: ${tagColor};">${TAG.VIDEO.height}</b> — высота видео; <b style="color: ${tagColor};">${TAG.VIDEO.width}</b> — ширина видео; <br>
        <b style="color: ${tagColor};">${TAG.VIDEO.codec}</b> — кодек видео; <b style="color: ${tagColor};">${TAG.VIDEO.codecProfile}</b> — профиль кодека; <b style="color: ${tagColor};">${TAG.VIDEO.aspect}</b> — соотношение сторон; <br>
        <b style="color: ${tagColor};">${TAG.VIDEO.bitrate}</b> — битрейт видео; <b style="color: ${tagColor};">${TAG.VIDEO.fps}</b> — частота кадров (fps); <b style="color: ${tagColor};">${TAG.VIDEO.bitDepth}</b> — битовая глубина;<br>
        <b style="color: ${tagColor};">${TAG.VIDEO.chromaSubsampling}</b> — субдискретизация насыщенности; <b style="color: ${tagColor};">${TAG.VIDEO.colorPrimaries}</b> — основные цвета;<br>
        <br>
        Поля ниже берутся из формы, если значения заполнены:<br>
        <b style="color: ${tagColor};">${TAG.FORM.quality}</b> — качество видео; <b style="color: ${tagColor};">${TAG.FORM.reaper}</b> — автор рипа;<br>
        <b style="color: ${tagColor};">${TAG.FORM.poster}</b> — ссылка на постер; <b style="color: ${tagColor};">${TAG.FORM.MI}</b> — тех. данные;<br>
        <b style="color: ${tagColor};">${TAG.FORM.screenshots}</b> — скриншоты;<br>
        <br>
        <b style="color: ${tagColor};">${TAG.AUDIO.start}</b> — начало блока аудио; <b style="color: ${tagColor};">${TAG.AUDIO.end}</b> — конец блока аудио;<br>
        <br>
        Внутри блока можно сформировать свой шаблон дорожки с аудио:<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.index}</b> — порядоковый номер <b style="color: ${tagColor};">${TAG.TEMPLATE.language}</b> — язык; <b style="color: ${tagColor};">${TAG.TEMPLATE.flag}</b> — ссылка на флаг с static.rutracker.cc;<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.codec}</b> — кодек; <b style="color: ${tagColor};">${TAG.TEMPLATE.bitRate}</b> — битрейт; <br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.sampleRate}</b> — частота; <b style="color: ${tagColor};">${TAG.TEMPLATE.bitDepth}</b> — битовая глубина;<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.channels}</b> — количество каналов; <b style="color: ${tagColor};">${TAG.TEMPLATE.title}</b> — название;<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.type}</b> — 'в составе контейнера' или 'внешним файлом';<br>
        <br>
        <b style="color: ${tagColor};">${TAG.SUB.start}</b> — начало блока субтитров; <b style="color: ${tagColor};">${TAG.SUB.end}</b> — конец блока субтитров;<br>
        <br>
        Внутри блока можно сформировать свой шаблон строки субтитров:<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.index}</b> — порядоковый номер; <b style="color: ${tagColor};">${TAG.TEMPLATE.language}</b> — язык; <b style="color: ${tagColor};">${TAG.TEMPLATE.flag}</b> — ссылка на флаг с static.rutracker.cc;<br>
        <b style="color: ${tagColor};">${TAG.TEMPLATE.format}</b> — формат субтитров; <b style="color: ${tagColor};">${TAG.TEMPLATE.title}</b> — название;<br>
        <br>
        <i style="color: ${tagColor};">${TAG.TEMPLATE.language}</i> — поддерживает следующие языки: русский, английский, японский, китайский, казахский;<br>
        <i style="color: ${tagColor};">${TAG.TEMPLATE.flag}</i> — поддерживает флаги: русский, английский, японский;<br>
    `;

        modalContent.appendChild(infoContainer);

        const templateArea = document.createElement('textarea');
        templateArea.value = localStorage.getItem(localStorageName);
        templateArea.rows = 20;
        templateArea.id = 'templateArea';
        templateArea.style.width = '100%';
        templateArea.style.resize = 'vertical';
        modalContent.appendChild(templateArea);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.marginTop = '10px';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.style.marginRight = '10px';
        saveButton.style.backgroundColor = '#547eca';
        saveButton.style.padding = '5px 10px';
        saveButton.style.borderRadius = '5px';

        saveButton.addEventListener('click', function () {
            localStorage.setItem(localStorageName, templateArea.value);
            showNotification('Шаблон сохранен');
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.style.backgroundColor = '#d67688';
        closeButton.style.padding = '5px 10px';
        closeButton.style.borderRadius = '5px';
        closeButton.addEventListener('click', closeModal);

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(closeButton);
        modalContent.appendChild(buttonContainer);

        const closeButtonSymbol = document.createElement('div');
        closeButtonSymbol.innerHTML = '❌';
        closeButtonSymbol.style.position = 'absolute';
        closeButtonSymbol.style.top = '10px';
        closeButtonSymbol.style.right = '10px';
        closeButtonSymbol.style.fontSize = '24px';
        closeButtonSymbol.style.cursor = 'pointer';
        closeButtonSymbol.addEventListener('click', closeModal);

        modalContent.appendChild(closeButtonSymbol);
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);

        function openModal() {
            modalContainer.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }

        function closeModal() {
            modalContainer.style.display = 'none';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        const openButton = document.getElementById('setTemplateButton');
        if (!openButton) return;
        openButton.addEventListener('click', openModal);
    }

    const generate = (template) => {
        if (animeInfo == null) {
            alert("Вставьте ссылку на аниме и нажмите \"Заполнить\"");
            return;
        }
        if (miInfo == null) {
            alert("Вставьте MediaInfo в поле \"Подробные тех. данные\" и нажмите \"Заполнить тех. данные\"");
            return;
        }
        const audio = miInfo.audioInfo;
        let code = template;
        const qualitySelect = table['Качество видео'].input[0];
        const qualityValue = qualitySelect.options[qualitySelect.selectedIndex].textContent;
        const header = () => {
            const names = [];
            const romName = animeInfo.names?.romaji;
            if (romName) {
                if (romName.toLowerCase() === animeInfo.names?.en?.toLowerCase()) {
                    if (animeInfo.names.synonym) {
                        names.push(animeInfo.names.synonym);
                    }
                }
                else {
                    names.push(romName);
                }
            }
            if (animeInfo.names?.en) {
                names.push(animeInfo.names.en);
            }
            if (animeInfo.names?.ru) {
                names.push(animeInfo.names.ru);
            }

            const spCount = animeInfo.episodes?.filter(ep => ep.type === episodeType.SP).length || 0;
            const typeSelect = table['Тип'].input[0];
            const typeValue = typeSelect.options[typeSelect.selectedIndex].textContent;
            const episodes = spCount > 0 ? `${animeInfo.type.episodes}+${spCount}` : animeInfo.type.episodes;
            const langSelect = table['Язык озвучки(для заголовка)'].input[0];
            const langHeader = langSelect.options[langSelect.selectedIndex].textContent;

            return `${names.join(" | ")} [${table['Год выпуска'].input.value}, ${typeValue}, ${episodes} из ${episodes}] ${qualityValue} ${table['Характеристики видео(для заголовка)'].input.value} ${langHeader}`;
        }
        const names = () => {
            return formatNames("\n");
        };
        const namesString = () => {
            return formatNames(" | ");
        };
        const formatNames = (separator) => {
            const names = [];

            if (animeInfo.names?.kanji) {
                names.push(animeInfo.names.kanji);
            }
            const romName = animeInfo.names?.romaji;
            if (romName) {
                if (romName.toLowerCase() === animeInfo.names?.en?.toLowerCase()) {
                    if (animeInfo.names.synonym) {
                        names.push(animeInfo.names.synonym);
                    }
                }
                else {
                    names.push(romName);
                }
            }

            if (animeInfo.names?.en) {
                names.push(animeInfo.names.en);
            }
            if (animeInfo.names?.ru) {
                names.push(animeInfo.names.ru);
            }
            return names.join(separator);
        };
        const formatLink = (name, link) => `[url=${link}]${name}[/url]`;
        const studioNames = () => animeInfo.studios.map(studio => studio.name).join(', ');
        const studio = () => animeInfo.studios.map(studio => formatLink(studio.name, studio.link)).join(', ');
        const episodes = () => {
            return table['Эпизоды'].input.value;
        }
        const getFlagByLang = (lang) => {
            switch (lang) {
                case LANG.JAP:
                    return 'http://i5.imageban.ru/out/2015/02/23/839c5b0694b634374eebbe9fcb519cb6.png';
                case LANG.RUS:
                    return 'http://i4.imageban.ru/out/2015/02/23/2b34ca3f87aa5be5015c3073466f162f.png';
            }
            return null;
        }
        console.log(animeInfo);
        code = code.replaceAll(TAG.header, header)
            .replaceAll(TAG.names, names)
            .replaceAll(TAG.namesString, namesString)
            .replaceAll(TAG.country, animeInfo.country)
            .replaceAll(TAG.year, animeInfo.season.year)
            .replaceAll(TAG.season, animeInfo.season.name)
            .replaceAll(TAG.genre, animeInfo.genres)
            .replaceAll(TAG.type, animeInfo.type.type)
            .replaceAll(TAG.episodeCount, animeInfo.type.episodes)
            .replaceAll(TAG.episodeDuration, animeInfo.type.duration)
            .replaceAll(TAG.director, animeInfo.director)
            .replaceAll(TAG.studio, studio)
            .replaceAll(TAG.studioNames, studioNames)
            .replaceAll(TAG.description, animeInfo.description)
            .replaceAll(TAG.episodes, episodes)
            .replaceAll(TAG.release, animeInfo.release)
            .replaceAll(TAG.LINK.AniDb, animeInfo.links.AniDb ? animeInfo.links.AniDb : TAG.LINK.AniDb)
            .replaceAll(TAG.LINK.ANN, animeInfo.links.ANN ? animeInfo.links.ANN : TAG.LINK.ANN)
            .replaceAll(TAG.LINK.MAL, animeInfo.links.MAL ? animeInfo.links.MAL : TAG.LINK.MAL)
            .replaceAll(TAG.LINK.Shikimori, animeInfo.links.Shikimori ? animeInfo.links.Shikimori : TAG.LINK.Shikimori)
            .replaceAll(TAG.LINK.WA, animeInfo.links.WA ? animeInfo.links.WA : TAG.LINK.WA)

            .replaceAll(TAG.VIDEO.ext, miInfo.videoInfo.fileExt)
            .replaceAll(TAG.VIDEO.codec, miInfo.videoInfo.codec)
            .replaceAll(TAG.VIDEO.codecProfile, miInfo.videoInfo.codecProfile)
            .replaceAll(TAG.VIDEO.width, miInfo.videoInfo.width)
            .replaceAll(TAG.VIDEO.height, miInfo.videoInfo.height)
            .replaceAll(TAG.VIDEO.aspect, miInfo.videoInfo.aspect)
            .replaceAll(TAG.VIDEO.chromaSubsampling, miInfo.videoInfo.chromaSubsampling)
            .replaceAll(TAG.VIDEO.colorPrimaries, miInfo.videoInfo.colorPrimaries)
            .replaceAll(TAG.VIDEO.bitrate, miInfo.videoInfo.bitRate)
            .replaceAll(TAG.VIDEO.fps, miInfo.videoInfo.fps)
            .replaceAll(TAG.VIDEO.bitDepth, miInfo.videoInfo.bitDepth);

        const matchAudio = code.match(new RegExp(`${TAG.AUDIO.start}(.*?)${TAG.AUDIO.end}`));
        const matchSubs = code.match(new RegExp(`${TAG.SUB.start}(.*?)${TAG.SUB.end}`));

        if (matchAudio) {
            const audioTemplate = matchAudio[1];
            const audios = [];
            if (!!audio.int) {
                audio.int.forEach(item => {
                    item.type = 'в составе контейнера';
                    audios.push(item);
                });
            }
            if (!!audio.ext) {
                audio.ext.forEach(item => {
                    item.type = 'внешним файлом';
                    audios.push(item);
                });
            }

            const replacement = audios.map((info, index) => {
                const _index = index + 1;

                const flag = getFlagByLang(info.language);
                return audioTemplate.trim()
                    .replace(TAG.TEMPLATE.index, _index)
                    .replace(TAG.TEMPLATE.flag, flag ? flag : TAG.TEMPLATE.flag)
                    .replace(TAG.TEMPLATE.language, info.language ? info.language : TAG.TEMPLATE.language)
                    .replace(TAG.TEMPLATE.codec, info.codec ? info.codec : TAG.TEMPLATE.codec)
                    .replace(TAG.TEMPLATE.bitRate, info.bitRate ? info.bitRate : TAG.TEMPLATE.bitRate)
                    .replace(TAG.TEMPLATE.sampleRate, info.sampleRate ? info.sampleRate : TAG.TEMPLATE.sampleRate)
                    .replace(TAG.TEMPLATE.bitDepth, info.bitDepth ? info.bitDepth : TAG.TEMPLATE.bitDepth)
                    .replace(TAG.TEMPLATE.channels, info.channels ? info.channels : TAG.TEMPLATE.channels)
                    .replace(TAG.TEMPLATE.title, info.title ? info.title : TAG.TEMPLATE.title)
                    .replace(TAG.TEMPLATE.type, info.type ? info.type : TAG.TEMPLATE.type)
            }).join('\n');

            code = code.replace(new RegExp(`${TAG.AUDIO.start}(.*?)${TAG.AUDIO.end}`), replacement).trim();
        }
        if (matchSubs) {
            const subsTemplate = matchSubs[1];
            const replacement = miInfo.textInfo.map((info, index) => {
                const flag = getFlagByLang(info.language);
                return subsTemplate.trim()
                    .replace(TAG.TEMPLATE.index, index + 1)
                    .replace(TAG.TEMPLATE.flag, flag ? flag : TAG.TEMPLATE.flag)
                    .replace(TAG.TEMPLATE.language, info.language ? info.language : TAG.TEMPLATE.language)
                    .replace(TAG.TEMPLATE.format, info.format ? info.format : TAG.TEMPLATE.format)
                    .replace(TAG.TEMPLATE.title, info.title ? info.title : TAG.TEMPLATE.title)
            }).join('\n');

            code = code.replace(new RegExp(`${TAG.SUB.start}(.*?)${TAG.SUB.end}`), replacement).trim();
        }

        return code.replaceAll(TAG.FORM.quality, qualityValue)
            .replaceAll(TAG.FORM.reaper, document.getElementById('reaperField').value)
            .replaceAll(TAG.FORM.poster, table['Обложка'].input.value)
            .replaceAll(TAG.FORM.screenshots, table['Скриншоты'].input.value)
            .replaceAll(TAG.FORM.MI, table['MediaInfo'].input.value);
    }

    const init = () => {
        addUrlRow();
        addTechButton();
        addTemplateRow();
        createModal();
        addReaperField();
    }

    init();

})();