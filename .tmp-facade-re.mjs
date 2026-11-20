const names = ['Рабочий стол 1 дв', 'Рабочий стол без дв', 'Рабочий стол без дв и полки'];
function check(name) {
  const n = name.toLowerCase();
  const withoutByName = /без\s*двер|без\s*дв\b|без\s*дв/.test(n);
  const withByName = /с\s*двер|\d+\s*дв|1\s*дв|дверь|фасад/.test(n) && !withoutByName;
  // broken original
  const broken = /\b\d+\s*дв\b|\b1\s*дв\b/.test(n);
  console.log(JSON.stringify({name, withoutByName, withByName, broken}));
}
names.forEach(check);
