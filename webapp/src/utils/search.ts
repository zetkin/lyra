export function textIncludesQuery(text: string, query: string) {
  return text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

export function splitTextOnQuery(text: string, query: string) {
  return text.split(new RegExp(`(${query})`, 'gi'));
}

export function textMatchesQuery(text: string, query: string) {
  return text.toLocaleLowerCase() === query.toLocaleLowerCase();
}
