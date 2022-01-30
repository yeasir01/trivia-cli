#!/usr/bin/env node
import chalk from "chalk"
import chalkAnimation from "chalk-animation"
import axios from "axios";
import inquirer from 'inquirer';
import center from 'center-align';
import he from 'he';

const BASE_URL = 'https://opentdb.com/api.php';
const TOKEN_URL = 'https://opentdb.com/api_token.php?command=request';
const CATEGORY_URL = 'https://opentdb.com/api_category.php';

const CONFIG_ICON = chalk.bold.yellowBright(' [>]');
const QUESTION_ICON = chalk.bold.greenBright(` [?]`);
const FAIL_ICON = chalk.bold.redBright(' [X]')
const LINE_WIDTH = 100;

let correct = {};
let fullURL;

const sleep = (ms = 2000) => new Promise(r => setTimeout(r, ms));
const clear = () => console.clear();
const drawBreak = () => console.log('\r');
const drawLine = (symbol="*", width = LINE_WIDTH) => console.log(symbol.repeat(width));

function handleError(err) {
    console.log(FAIL_ICON, chalk.redBright(err?.message || err?.msg || "Somthing Went Wrong!"))
};

function buildSearchParams(obj) {
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
};

function getShuffledQuestions(wrong = [], right = "") {
    let array = [...wrong, right].map(item=> he.decode(item));
    
    //Fisher–Yates Shuffle
    let m = array.length
    let t;
    let i;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    return array;
}

async function getSessionToken(url) {
    try {
        const { data } = await axios.get(url)
        return {
            token: data.token
        };
    } catch (err) {
        throw (err);
    }
};

async function getCategoryList(url) {
    try {
        const { data } = await axios.get(url);
        const arry = data["trivia_categories"];
        return arry.map(item => ({ name: item.name, value: item.id }));
    } catch (err) {
        throw (err)
    }
};

async function welcome() {
    try {
        clear();
        drawLine()
        drawBreak()
        const title = chalkAnimation.rainbow(center('WELCOME TO TRIVIA-CLI!', LINE_WIDTH), 4);
        await sleep(1500);
        console.log(chalk.italic.whiteBright(center('The best trivia questions, now live in your terminal!', LINE_WIDTH)));
        title.stop();
        drawBreak()
        drawLine()
    } catch (err) {
        handleError(err);
    }
};

async function getQuestions(url) {
    try {
        const { data } = await axios.get(url);
        return data.results;
    } catch (err) {
        handleError(err);
    }
};

async function getUserConfig() {
    try {
        let categories = await getCategoryList(CATEGORY_URL);

        let answers = await inquirer.prompt([{
            type: 'number',
            name: 'amount',
            prefix: CONFIG_ICON,
            message: 'Number of questions?'
        }, {
            type: 'rawlist',
            name: 'category',
            prefix: CONFIG_ICON,
            message: 'Which category?',
            choices: categories
        }, {
            type: 'list',
            name: 'difficulty',
            prefix: CONFIG_ICON,
            message: 'difficulty?',
            choices: [{
                name: "Easy",
                value: "easy"
            }, {
                name: "Medium",
                value: "medium"
            }, {
                name: "Hard",
                value: "hard"
            }]
        }, {
            type: 'list',
            name: 'type',
            prefix: CONFIG_ICON,
            message: 'Question types?',
            choices: [{
                name: "True/False",
                value: 'boolean'
            }, {
                name: "Multiple Choice",
                value: 'multiple'
            }]
        }])

        return answers;
    } catch (err) {
        handleError(err);
    }
};

async function buildURLQuery() {
    try {
        const token = await getSessionToken(TOKEN_URL);
        const configObj = await getUserConfig();
        const queryString = buildSearchParams({ ...token, ...configObj });

        fullURL = BASE_URL + "?" + queryString;
    } catch (err) {
        handleError(err);
    }
};

async function renderQuestions() {
    try {
        drawLine("-");
        drawBreak();

        let questions = await getQuestions(fullURL);
        let prompts = [];

        if (questions.length === 0) {
            return console.log(chalk.yellow(`🔍 Sorry, there doesn't seem to be any questions that match your critria. Please try again.`))
        }

        questions.map((item, idx) => {
            const { type, question, correct_answer, incorrect_answers } = item;
            const parsedQuestion = he.decode(question);

            //set the correct answers in an object for lookup later.
            correct[idx] = correct_answer;

            if (type === "boolean") {
                return prompts.push({
                    type: 'list',
                    prefix: QUESTION_ICON,
                    name: `${idx}`,
                    message: parsedQuestion,
                    choices: ["True", "False"]
                })
            }

            prompts.push({
                type: 'list',
                prefix: QUESTION_ICON,
                name: `${idx}`,
                message: parsedQuestion,
                choices: getShuffledQuestions(incorrect_answers, correct_answer),
            })
        })
        
        let answers = await inquirer.prompt(prompts);
        console.log("answered", answers);
        console.log('correct', correct)

    } catch (err) {
        handleError(err)
    }
}

await welcome();
await buildURLQuery();
await renderQuestions();