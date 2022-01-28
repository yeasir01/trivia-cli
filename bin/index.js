#!/usr/bin/env node
import chalk from "chalk"
import chalkAnimation from "chalk-animation"
import axios from "axios";
import inquirer from 'inquirer';

const BASE_URL = 'https://opentdb.com/api.php';
const TOKEN_URL = 'https://opentdb.com/api_token.php?command=request';
const CATEGORY_URL = 'https://opentdb.com/api_category.php';

let questions;
let urlQuery;

const log = console.log;
const sleep = (ms = 2000) => new Promise(r => setTimeout(r, ms));

function handleError(err) {
    log(chalk.redBright(err?.message || err?.msg))
}

async function getSessionToken(url) {
    try {
        const { data } = await axios.get(url)
        return {
            token: data.token
        };
    } catch (err) {
        throw(err);
    }
}

async function getCategoryList(url) {
    try {
        const { data } = await axios.get(url);
        const arry = data["trivia_categories"];
        return arry.map(item => ({ name: item.name, value: item.id }));
    } catch (err) {
        throw(err)
    }
}

async function welcome() {
    try {
        console.clear();
        const title = chalkAnimation.rainbow('WELCOME TO QUIZ-ME!', 4);
        const msg = `The best trivial questions, now in your terminal!`;
        await sleep();
        title.stop();
        log(chalk.italic.gray(msg));
    } catch (err) {
        handleError(err);
    }
};

async function getQuestions(url) {
    try {
        const { data } = await axios.get(url);
        questions = data.results;
    } catch (err) {
        handleError(err);
    }
};

async function getUserInput() {
    try {
        let categories = await getCategoryList(CATEGORY_URL);

        let userInput = await inquirer.prompt([{
            type: 'number',
            name: 'amount',
            message: 'Number of questions?'
        }, {
            type: 'rawlist',
            name: 'category',
            message: 'Choose a category',
            choices: categories
        }, {
            type: 'list',
            name: 'difficulty',
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
            message: 'Question types?',
            choices: [{ 
                name: "True/False", 
                value: 'boolean' 
            }, { 
                name: "Multiple Choice", 
                value: 'multiple' 
            }]
        }])
        return userInput;
    } catch (err) {
        handleError(err);
    }
}

function getQueryString(obj){
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
}

async function buildURLQuery() {
    try {
        const token = await getSessionToken(TOKEN_URL);
        const userInputObj = await getUserInput();
        const queryString = getQueryString({...userInputObj, ...token});

        urlQuery = BASE_URL + "?" + queryString;
    } catch (err) {
        handleError(err);
    }
}

await welcome();
await buildURLQuery();
//await getQuestions(urlQuery);

log(urlQuery);