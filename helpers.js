'use strict';
const httpntlm = require('httpntlm');
const chalk = require('chalk');
var Spinner = require('cli-spinner').Spinner;
var spinner = new Spinner(chalk.yellow('authenticating... %s'));
spinner.setSpinnerString(Math.floor(Math.random() * 20 + 1));

module.exports = {
  authenticateUser: ({ username, password }) => {
    return new Promise((resolve, reject) => {
      spinner.start();
      httpntlm.get(
        {
          username,
          password,
          url: 'https://cms.guc.edu.eg/apps/student/HomePageStn.aspx',
          rejectUnauthorized: false,
        },
        (err, res) => {
          spinner.stop(true);

          console.log(
            res.statusCode === 200
              ? chalk.greenBright('[+] You are authorized')
              : chalk.redBright('[!] You are not authorized. Please review your login credentials.')
          );
          resolve(res.statusCode === 200);
        }
      );
    });
  }

}