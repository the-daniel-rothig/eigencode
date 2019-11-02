const messagesForLogOnce = [];
  
export default (message, level = 'warn') => {
  if (!messagesForLogOnce.includes(message)) {
    messagesForLogOnce.push(message);
    console[level](message);
  }  
}