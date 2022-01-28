#!/usr/bin/env node
import chalk from "chalk"
import chalkAnimation from "chalk-animation"
import axios from "axios";
import inquirer from 'inquirer';

const log = console.log;
const sleep = (ms = 2000) => new Promise(r => setTimeout(r, ms));

let categories;
let questions;
let urlQuery = 'https://opentdb.com/api.php?';

function handleError(err) {
    log(chalk.redBright(err?.message || err?.msg))
}

async function getSessionToken(){
    try {
        const { data } = await axios.get('https://opentdb.com/api_token.php?command=request')
        urlQuery += `&token=${data.token}`;
    } catch (err) {
        handleError(err);
    }
}

async function getCategories(){
    try {
        const { data } = await axios.get('https://opentdb.com/api_category.php')
        const arry = data["trivia_categories"];
        categories = arry.map(item=>({name: item.name, value: item.id}));
    } catch (err) {
        handleError(err);
    }
}

async function welcome() {
    try {
        console.clear();
        const title = chalkAnimation.rainbow('WELCOME TO QUIZ-ME!', 4);
        const msg = `The best command line trivia games are now in your terminal!`;
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

async function userOptions() {
    try {
        const userInput = await inquirer.prompt([{
            type: 'number',
            name: 'amount',
            message: 'Number of questions?'
        },{
            type: 'rawlist',
            name: 'category',
            message: 'Choose a category',
            choices: [...categories]
        },{
            type: 'list',
            name: 'difficulty',
            message: 'difficulty?',
            choices: ["easy", "medium", "hard"]
        },{
            type: 'list',
            name: 'type',
            message: 'Question types?',
            choices: [{name: "True/False", value: 'boolean'}, {name: "Multiple Choice", value: 'multiple'}]
        }])
    } catch (err) {
        handleError(err);
    }
}

await welcome();
await getSessionToken();
await getCategories();
await userOptions();
//await getQuestions(urlQuery);

log(urlQuery)
//log(questions)