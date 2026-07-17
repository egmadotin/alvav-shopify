const fs = require('fs');
const path = require('path');

const filePath = 'd:/FREELANCING/AlvavShopify/sections/header.liquid';
const content = fs.readFileSync(filePath, 'utf8');

// Strip out Liquid blocks {% ... %} and {{ ... }} to focus only on HTML tags
const cleanContent = content
  .replace(/{%[\s\S]*?%}/g, '')
  .replace(/{{[\s\S]*?}}/g, '');

const tagRegex = /<\/?([a-zA-Z0-9:-]+)(?:\s+[^>]*?)?>/g;
let match;
const stack = [];

console.log("Analyzing HTML tags...");

while ((match = tagRegex.exec(cleanContent)) !== null) {
  const fullTag = match[0];
  const tagName = match[1].toLowerCase();
  const isClosing = fullTag.startsWith('</');
  const isSelfClosing = fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName);

  if (isSelfClosing) {
    if (isClosing) {
      console.log(`Error: Closing self-closing tag: ${fullTag}`);
    }
    continue;
  }

  if (isClosing) {
    if (stack.length === 0) {
      console.log(`Error: Mismatched closing tag ${fullTag} with empty stack`);
    } else {
      const popped = stack.pop();
      if (popped.name !== tagName) {
        console.log(`Error: Mismatched closing tag ${fullTag}. Expected closing for <${popped.name}> (from line ${popped.line})`);
      }
    }
  } else {
    // Find line number
    const offset = match.index;
    const linesBefore = cleanContent.substring(0, offset).split('\n');
    const lineNum = linesBefore.length;
    stack.push({ name: tagName, tag: fullTag, line: lineNum });
  }
}

if (stack.length > 0) {
  console.log("Error: Unclosed tags remaining on stack:");
  stack.forEach(t => console.log(`  <${t.name}> opened on line ${t.line}`));
} else {
  console.log("All HTML tags are perfectly balanced!");
}
