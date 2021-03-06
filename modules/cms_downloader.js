'use strict';
const puppeteer = require('puppeteer');
const fs = require('fs');
const httpntlm = require('httpntlm');
const authData = require('./../data.json');

const machine_type = process.platform;
const fileSeparator = () => {
  return machine_type === 'win32' ? '\\' : '/';
};

const pupp_options = {
  headless: true,
};


const navigateTo = async (page, target_link) => {
  await page.goto(target_link, {
    waitUntil: 'networkidle0',
    timeout: 500000,
  });
};

const getAvailableCourses = async (page) => {
  console.log('[-] Fetching Courses');
  return await page.evaluate(() => {
    const courses_menu = document.querySelectorAll(
      'ul[class="vertical-nav-menu metismenu"]'
    )[0].childNodes[5].childNodes[3].childNodes;
    const courses_links = [];
    for (var i = 1; i < courses_menu.length; i += 2) {
      if (!courses_menu[i].children[0].href.includes('ViewAllCourseStn'))
        courses_links.push(courses_menu[i].children[0].href.trim());
    }
    return courses_links;
  });
};

const getCourseName = async (page) => {
  return await page.evaluate(() => {
    let name = document
      .querySelectorAll(
        'span[id="ContentPlaceHolderright_ContentPlaceHoldercontent_LabelCourseName"]'
      )[0]
      .innerHTML.toString()
      .trim();
    name = name.substring(0, name.lastIndexOf('(')).trim(); // Remove courseID
    name = name.replaceAll('|', '').replaceAll('(', '[').replaceAll(')', ']'); // Remove the '|' then replace () with []
    return name.trim();
  });
};

const getUnratedContent = async (page) => {
  return await page.evaluate(() => {
    const content = [];
    document
      .querySelectorAll(
        'input[class="btn btn-danger close1"][style="display: none;"]' // The unrated content flag
      )
      .forEach((el) => {
        content.push({
          week: el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].children[0].innerHTML.trim(),
          name: el.parentElement.parentElement.children[0].children[0].download,
          link: el.parentElement.parentElement.children[0].children[0].href,
        });
      });
    return content;
  });
};

const resolveContentName = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('a[download]').forEach((el) => {
      const fileName =
        el.parentElement.parentElement.parentElement.children[0].children[0]
          .innerHTML;
      const fileExtension = el.href.split('.')[
        document.querySelectorAll('a[download]')[0].href.split('.').length - 1
      ];
      const fullName = `${fileName}.${fileExtension}`;
      el.download = fullName;
    });
  });
};

const rateContent = async (page, content_name) => {
  return await page.evaluate((content_name) => {
    document
      .querySelectorAll(`a[download="${content_name}"]`)[0]
      .parentElement.parentElement.children[1].children[1].children[0].click();
  }, content_name);
};

const downloadContent = async (page, course_name, content) => {
  const download = (url, file_path, file_name) => {
    if (!fs.existsSync(file_path)) fs.mkdirSync(file_path, { recursive: true });

    console.log(`[-] Downloading file (${file_name})...`);

    return new Promise((resolve, reject) => {
      httpntlm.get(
        {
          ...authData,
          url: url,
          rejectUnauthorized: false,
          binary: true,
        },
        (err, res) => {
          // Request failed
          if (err) {
            console.log(
              'There is an error in the request, please report it. Error is: ',
              err.message
            );
            reject('Request Error');
          }

          // Request success, write to the file
          fs.writeFile(
            `${file_path}${fileSeparator()}${file_name}`,
            res.body,
            (err) => {
              if (err) {
                console.log(
                  'There is an error in file writing, please report it. Error is: ',
                  err.message
                );
                reject('FileWriting Error');
              }
              console.log(
                `[+] Download completed. "${file_name}" is saved successfully in ${file_path}`
              );
              console.log('------------');
              resolve();
            }
          );
        }
      );
    });
  };

  const dir_name = `.${fileSeparator()}Downloads${fileSeparator()}cms_downloads${fileSeparator()}${course_name}`;
  for (let i = 0; i < content.length; i++) {
    await download(
      content[i].link,
      `${dir_name}${fileSeparator()}${content[i].week.replace(':', '')}`,
      content[i].name
    );

    // Rate the downloaded content
    await rateContent(page, content[i].name);
  }
};

// Start the script
console.log('[+] Everything is up-to-date');
console.log('============');

module.exports = async () => {
  const browser = await puppeteer.launch(pupp_options);
  const page = await browser.newPage();

  // 0- Go to CMS home page
  await page.authenticate(authData);
  await navigateTo(
    page,
    'https://cms.guc.edu.eg/apps/student/HomePageStn.aspx'
  );

  // 1- Get Available Courses
  const available_courses = await getAvailableCourses(page);
  console.log('[+] Fetching Courses Done');
  console.log('============');

  for (let i = 0; i < available_courses.length; i++) {
    // 2- Navigate to the course page
    await navigateTo(page, available_courses[i]);
    const course_name = await getCourseName(page);

    // 3- Rename the download name
    await resolveContentName(page);

    // 4- Get unrated courses
    const unrated_content = await getUnratedContent(page);
    if (unrated_content.length === 0) {
      console.log(
        `There are no new (unrated) content in this course: ${course_name}`
      );
      console.log('============');
    } else {
      console.log(`Found new content in this course: ${course_name}`);
      // 5- Start downloading 🔥. Then rate the downloaded.
      await downloadContent(page, course_name, unrated_content);
    }
  }
  // 6- End the session
  await browser.close();
};
