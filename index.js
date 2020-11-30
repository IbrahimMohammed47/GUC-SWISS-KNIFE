const fs = require('fs');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('./inquirier.js');

const modules = require('./modules');
const { authenticateUser } = require('./helpers');
init();

async function init() {
  showBanner();
  runMainMenu();
}

async function runMainMenu() {
  const choice = await inquirer.showMainMenu();
  switch (choice.mainMenu) {
    case 'login':
      runLogin();
      break;
    case 'tools':
      runToolsMenu();
      break;
    case 'exit':
      return;
  }
}

async function runToolsMenu() {
  // clear();
  const choice = await inquirer.showToolsMenu();
  switch (choice.toolsMenu) {
    case 'cms_downloader':
      await modules.cmsDownloader();
      break;
    case 'evaluation_roaster':
      await modules.evaluationRoaster();
      break;
    case 'back':
      return runMainMenu();
  }
  runToolsMenu();
}

async function runLogin() {
  clear();
  let isValid = false
  let credentials;
  while (!isValid) {
    credentials = await inquirer.askGUCCredentials();
    isValid = await authenticateUser(credentials);
  }
  let data = JSON.stringify(credentials);
  fs.writeFileSync('data.json', data);
  runMainMenu();

}

function showBanner() {
  let fonts = [
    'Wet Letter',
    'Red Phoenix',
    'Poison',
    'Pagga',
    'Larry 3D',
    'Impossible',
    'Ghost',
    'Flower Power',
    'Fire Font-s',
    'DOS Rebel',
    'Banner3-D',
  ];
  clear();
  console.log(
    chalk.greenBright.bold(
      figlet.textSync('GUC-SK', {
        font: fonts[Math.floor(Math.random() * fonts.length)],
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 300,
        height: 300,
      })
    ),
    chalk.white.bold(
      `\n ${chalk.bgGrey('By Ahmed As')}${chalk.bgYellow(
        'hraf & Ibrah'
      )}${chalk.bgRed('im Mohammed ')}`
    )
  );
}
