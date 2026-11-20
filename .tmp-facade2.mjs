function itemMatchesFacadeFilter(name, doorLayout, facadeFilter) {
  if (facadeFilter !== 'with' && facadeFilter !== 'without') return true;
  const n = String(name || '').toLowerCase();
  const dl = String(doorLayout || '').trim().toLowerCase();
  const withoutByName = /без\s*двер|без\s*дв(?:\s|$|[.,;:_-])/.test(n);
  const withoutByLayout = ['none','open','without','no_doors'].includes(dl);
  const withByLayout = ['corpus','doors','facade','with'].includes(dl);
  const withByName = !withoutByName && (/с\s*двер|\d+\s*дв|дверь|фасад/.test(n) || withByLayout);
  const isWithout = withoutByName || withoutByLayout;
  const isWith = !isWithout && (withByName || withByLayout);
  if (facadeFilter === 'without') return isWithout || (!isWith && !withByLayout);
  if (isWith) return true;
  if (isWithout) return false;
  return true;
}
const items = [
  ['Рабочий стол 1 дв', ''],
  ['Рабочий стол без дв', ''],
  ['Рабочий стол без дв и полки', ''],
  ['Шкаф 1 яруса 1 дв', ''],
  ['ВМУ1 левый', ''],
];
for (const [name, dl] of items) {
  console.log(name, 'with=', itemMatchesFacadeFilter(name, dl, 'with'), 'without=', itemMatchesFacadeFilter(name, dl, 'without'));
}
