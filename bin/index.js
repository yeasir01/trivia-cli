#!/usr/bin/env node
import chalk from "chalk"
import figlet from "figlet";
import axios from "axios";
import inquirer from 'inquirer';
import center from 'center-align';
import html from 'he';
import clear from "cli-clear";

const BASE_URL = 'https://opentdb.com/api.php';
const TOKEN_URL = 'https://opentdb.com/api_token.php?command=request';
const CATEGORY_URL = 'https://opentdb.com/api_category.php';

const CONFIG_ICON = chalk.bold.green(' [?]');
const FAIL_ICON = chalk.bold.redBright(' [!]')
const INFO_ICON = chalk.bold.yellowBright(' [I]')
const LINE_WIDTH = 81;

let answerLookup = {};

const insertBreak = () => console.log('\r');
const insertLine = (symbol="*", width = LINE_WIDTH) => console.log(symbol.repeat(width));
const indexIcon = (idx) => chalk.yellowBright(` [${idx + 1}]`);

function handleError(err) {
    console.log(FAIL_ICON, chalk.redBright(err?.message || err?.msg || "Something Went Wrong!"))
    //console.trace(err) //Uncomment this line for Debugging.
    process.exit(0);
};

function buildSearchParams(obj) {
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
};

function getShuffledAnswers(wrong = [], right = "") {
    let array = [...wrong, right].map(answer => html.decode(answer));
    
    //Fisher–Yates Shuffle
    let m = array.length;
    let t;
    let i;

    while (m) {
      i = Math.floor(Math.random() * m--);
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

function handleScore(userAnswers, correctAnswers){
    let correct = 0;
    let wrong = 0;
    let lookUp = {};
    
    for (let key in userAnswers){
        const isCorrect = userAnswers[key] === correctAnswers[key];
        isCorrect ? correct++ : wrong++;
        
        let idx = parseInt(key) + 1;
        lookUp[idx] = correctAnswers[key]
    }

    let score = Math.round((correct / (correct + wrong)) * 100);
    let icon = score >= 50 ? chalk.greenBright(' [S]') : chalk.redBright(' [S]');
    
    insertBreak();
    console.log(chalk.italic.grey(`HINT: Use the table below to check your answers.`));
    console.table(lookUp);
    insertBreak();
    console.log(icon ,`CORRECT: ${correct} WRONG: ${wrong} SCORE: ${score}% `);
}

async function getCategoryList(url) {
    try {
        const { data } = await axios.get(url);
        const array = data["trivia_categories"];
        return array.map(item => ({ name: item.name, value: item.id }));
    } catch (err) {
        throw (err)
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
            message: 'Number of questions?',
            default: 3,
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

        return BASE_URL + "?" + queryString;
    } catch (err) {
        handleError(err);
    }
};

async function renderQuestions() {
    try {
        insertLine();
        insertBreak();

        let fullURL = await buildURLQuery();
        let questions = await getQuestions(fullURL);
        let userPrompts = [];

        if (questions.length === 0) {
            console.log(chalk.yellow(INFO_ICON, `Sorry, there does not seem to be any questions that match your criteria. Please try again.`))
            return process.exit(1);
        }

        questions.map((item, idx) => {
            const { type, question, correct_answer, incorrect_answers } = item;
            const parsedQuestion = html.decode(question);

            //Parse & store the correct answers in an object for lookup later.
            answerLookup[idx] = html.decode(correct_answer);

            if (type === "boolean") {
                return userPrompts.push({
                    type: 'list',
                    prefix: indexIcon(idx),
                    name: `${idx}`,
                    message: parsedQuestion,
                    choices: ["True", "False"]
                })
            }

            userPrompts.push({
                type: 'list',
                prefix: indexIcon(idx),
                name: `${idx}`,
                message: parsedQuestion,
                choices: getShuffledAnswers(incorrect_answers, correct_answer),
            })
        })
        
        let userAnswers = await inquirer.prompt(userPrompts);
        
        handleScore(userAnswers, answerLookup)
    } catch (err) {
        handleError(err)
    }
}

async function welcome() {
    try {
        clear();
        insertLine()
        console.log(chalk.bold.magenta(center('  TRIVIA CLI', LINE_WIDTH)))
        insertBreak()
        console.log(chalk.greenBright(figlet.textSync(` Let's Play!`, {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'full',
            whitespaceBreak: true
        })))
        console.log(chalk.whiteBright(center('The best community-sourced trivia questions are now in your terminal!', LINE_WIDTH)));
        console.log(chalk.italic.whiteBright(center('Powered by Open Trivia API, Developed by Yeasir H.', LINE_WIDTH)));
        insertBreak()
        insertLine()
    } catch (err) {
        handleError(err);
    }
};

welcome()
    .then(renderQuestions);