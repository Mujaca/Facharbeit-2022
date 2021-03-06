const { getAllSeasonAnimes } = require('./anilist');
const { getBestShows } = require('./getBest');
var {getKeyWords} = require('./keywords');
const fs = require('fs')
var seasons = [
    "WINTER",
    "SPRING",
    "SUMMER",
    "FALL"
]

async function getRecommandations(userlists, allusers){
    return new Promise(async (resolve, reject) => {
        //console.log("started")
        var year = new Date().getFullYear() - 1;
        var animes = [];

        if(!fs.existsSync('./data/animes.json')) {
            for (let index = 0; index < 11; index++) {
                for (let i = 0; i < seasons.length; i++) {
                    const season = seasons[i];
                    var season_animes = await getAllSeasonAnimes(year, season);
                    console.log(season_animes.length, animes.length)
                    season_animes.forEach((anime) => {
                        if(!includesAnime(animes, anime)) animes.push(anime);
                    })
                }
                year--;
            }
        }else{
            animes = JSON.parse(fs.readFileSync('./data/animes.json'))
        }

        fs.writeFileSync('./data/animes.json', JSON.stringify(animes));

        //console.log(animes.length)

        Object.keys(allusers).forEach((user) => {
            var best = getBestShows(allusers[user]);
            best.forEach((anime) => {
                if(!includesAnime(animes, anime)) animes.push(anime);
            })
        })

        //console.log(animes.length)

        Object.values(userlists).forEach((anime) => {
            if(includesAnime(animes, anime)) {
                animes.forEach((singleAnime, index) => {
                    if(singleAnime.title.romaji == anime.title.romaji) animes.splice(index, 1);
                })
            }
        })

        //console.log(animes.length)

        var best = getBestShows(userlists);
        var recomandations = []

        animes.forEach((anime) => {
            var sum = 0;

            best.forEach((singleAnime) => {
                sum = sum + (calcuteSimilarities(anime, singleAnime) * singleAnime.score)
            })
            anime['recomandation'] = sum / best.length
            recomandations.push(anime);
        })

        recomandations.sort(function(a, b) {
            return b.recomandation - a.recomandation;
        });

        //fs.writeFileSync('./recomandations.json', JSON.stringify(recomandations))
        resolve(recomandations);
    })
}

function includesAnime(array, show) {
    var bool = false;
    array.forEach((arrobj) => {
        if(arrobj.title.romaji == show.title.romaji) bool = true;
    })
    return bool;
}

function calcuteSimilarities(show1, show2){
    var score = 0;
    var counted = 0;
    
    var show_genres = [];
    show1.genres.forEach((genre1) => {
        show2.genres.forEach((genre2) => {
            if(!show_genres.includes(genre2)) show_genres.push(genre2);
            if(genre1 == genre2) score++;
        })
        if(!show_genres.includes(genre1)) show_genres.push(genre1);
    })
    counted = counted + show_genres.length;

    var show_tags = [];
    show1.tags.forEach((tag1) => {
        show2.tags.forEach((tag2) => {
            if(!show_tags.includes(tag2.name)) show_tags.push(tag2.name);
            if(tag2.name == tag1.name) score++;
        });
        if(!show_tags.includes(tag1.name)) show_tags.push(tag1.name)
    })
    counted = counted + show_tags.length;

    var show1keywords = getKeyWords(show1.description);
    var show2keywords = getKeyWords(show2.description);

    var show_keywords = [];
    show1keywords.forEach((keyword1) => {
        show2keywords.forEach((keyword2) => {
            if(!show_keywords.includes(keyword2.keyword)) show_keywords.push(keyword2.keyword);
            if(keyword1.keyword == keyword2.keyword) score++;
        })
        if(!show_keywords.includes(keyword1.keyword)) show_keywords.push(keyword1.keyword);
    })
    counted = counted + show_keywords.length;

    return score / counted
}

exports.getRecommandations = getRecommandations;
exports.calcuteSimilarities = calcuteSimilarities;