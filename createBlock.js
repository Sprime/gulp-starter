/* eslint-disable */
'use strict';

// Генератор файлов блока

// Использование: node createBlock.js [имя блока] [доп. расширения через пробел]

const fs = require('fs');

const dir = {
  blocks: './src/blocks/'
};
const mkdirp = require('mkdirp');

const blockName = process.argv[2];
const defaultExtensions = ['html', 'scss']; // расширения по умолчанию
const extensions = uniqueArray(defaultExtensions.concat(process.argv.slice(3)));

// Если есть имя блока
if (blockName) {
  const dirPath = `${dir.blocks}${blockName}/`; // полный путь к создаваемой папке блока
  mkdirp(dirPath, (err) => {                    // создаем
    // Если какая-то ошибка — покажем
    if (err) {
      console.error(`Отмена операции: ${err}`);
    }

    // Нет ошибки, поехали!
    else {
      console.log(`Создание папки: ${dirPath} (если отсутствует)`);

      // Обходим массив расширений и создаем файлы, если они еще не созданы
      extensions.forEach((extension) => {
        const filePath = `${dirPath + blockName}.${extension}`; // полный путь к создаваемому файлу
        let fileContent = '';                                   // будущий контент файла
        let fileCreateMsg = '';                                 // будущее сообщение в консоли при создании файла

        if (extension === 'scss') {
          fileContent = `.${blockName} {\n  $block: &;\n}\n`;
          // fileCreateMsg = '';
        } else if (extension === 'js') {
          fileContent = `'use strict';\n`;
        } else if (extension === 'twig') {
          fileContent = ``;
        } else if (extension === 'images') {
          const imgFolder = `${dirPath}images/`;
          if (fileExist(imgFolder) === false) {
            mkdirp(imgFolder, (err) => {
              if (err) console.error(err);
              else console.log(`Создание папки: ${imgFolder} (если отсутствует)`);
            });
          } else {
            console.log(`Папка ${imgFolder} НЕ создана (уже существует) `);
          }
        }

        if (fileExist(filePath) === false && extension !== 'images' && extension !== 'md') {
          fs.writeFile(filePath, fileContent, (err) => {
            if (err) {
              return console.log(`Файл НЕ создан: ${err}`);
            }
            console.log(`Файл создан: ${filePath}`);
            if (fileCreateMsg) {
              console.warn(fileCreateMsg);
            }
          });
        } else if (extension !== 'images' && extension !== 'md') {
          console.log(`Файл НЕ создан: ${filePath} (уже существует)`);
        } else if (extension === 'md') {
          fs.writeFile(`${dirPath}readme.md`, fileContent, (err) => {
            if (err) {
              return console.log(`Файл НЕ создан: ${err}`);
            }
            console.log(`Файл создан: ${dirPath}readme.md`);
            if (fileCreateMsg) {
              console.warn(fileCreateMsg);
            }
          });
        }
      });

    }
  });
} else {
  console.log('Отмена операции: не указан блок');
}


function uniqueArray(arr) {
  const objectTemp = {};
  for (let i = 0; i < arr.length; i++) {
    const str = arr[i];
    objectTemp[str] = true;
  }
  return Object.keys(objectTemp);
}

function fileExist(path) {
  const fs = require('fs');
  try {
    fs.statSync(path);
  } catch (err) {
    return !(err && err.code === 'ENOENT');
  }
}
