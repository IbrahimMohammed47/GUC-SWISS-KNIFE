const inquirer = require('inquirer');

module.exports = {
  askGUCCredentials: () => inquirer.prompt([
    {
      name: 'username',
      type: 'input',
      message: 'Enter your guc email address:',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'fen el email ya liss';
        }
      },
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: function (value) {
        if (value.length) {
          return true;
        } else {
          return 'etla3 bel password now';
        }
      }
    }
  ]),
  showMainMenu: () => inquirer.prompt([
    {
      name: 'mainMenu',
      type: 'list',
      message: 'Main Menu',
      choices: ["login", "tools", "exit"]
    }
  ]),
  showToolsMenu: () => inquirer.prompt([
    {
      name: 'toolsMenu',
      type: 'list',
      message: 'Tools Menu',
      choices: ["cms_downloader", "evaluation_roaster", "back"]
    }
  ])

}
