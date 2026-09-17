import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

it('renders model Markdown tables as semantic cells, not raw pipe text',()=>{
 const html=renderToStaticMarkup(createElement(Markdown,{remarkPlugins:[remarkGfm],children:'| County | Wage |\n| --- | --- |\n| Shelby | $49,704 |\n| Auglaize | $50,968 |'}));
 expect(html).toContain('<table>');expect(html).toContain('<th>County</th>');expect(html).toContain('<td>Shelby</td>');expect(html).not.toContain('| --- |');
});
