import { logOnce } from "eigencode-shared-utils";

const fieldNameRegex = /^(?:the|your|my|their|a|an) (.+)$/
const camelCaseTestRegex = /\b[$A-Za-z][$a-z0-9]+[A-Z]/
const entirelyCamelCaseTestRegex = /^[$A-Za-z0-9]+$/;

export default name => {
  if (!name) {
    return name;
  }
  if (camelCaseTestRegex.test(name)) {
    const suggestion = name.replace(/[A-Z]/g, s => ` ${s}`).toLowerCase();
    logOnce(`field name seems to already be in camelCase: "${name}". This will affect validation messages. Please specify it in mid-sentence case instead (e.g. '${suggestion}')`, 'error');
  }
  if (entirelyCamelCaseTestRegex.test(name)) {
    return name;
  }
  const match = name.match(fieldNameRegex);
  if (!match) {
    logOnce(`field name "${name}" should begin with an article (the, your, my, their, a, an)`);
  }
  const asCamelCase = (match ? match[1] : name).trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, "").replace(/[\s\-]+(.)/g, (match, firstCharacter) => firstCharacter.toUpperCase());
  return asCamelCase;
}