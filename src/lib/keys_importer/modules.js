import Github from './github';
import Gitlab from './gitlab';

const modules = {
  github: Github,
  gitlab: Gitlab
};

export const getKeysImporterModule = name => {
  return modules[name];
};

export const getKeysImporterModulesList = () => {
  return Object.keys(modules);
};
