import fs from 'fs';
import path from 'path';

export const getDirFiles = (dir, onlyDir) => {
  try {
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
      return false;
    }
  } catch (e) {
    return false;
  }
  let files = fs.readdirSync(dir);
  if (onlyDir) {
    files = files.filter(file => {
      const stat = fs.statSync(path.join(dir, file));
      return stat.isDirectory();
    });
  }
  return files;
};

export const readdir = path => {
  return new Promise((resolve, reject) => {
    fs.readdir('plugins', (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
};
