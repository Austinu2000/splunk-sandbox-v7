# V6 search editor

Search and the Search Lab editors now highlight SPL commands, functions, strings,
numbers, keywords, macros, and comments while typing.

Use three backticks on each side of an SPL comment. Select text and press Cmd+/
(macOS) or Ctrl+/ to toggle a comment, or use the Toggle comment button. With no
selection, the shortcut inserts an empty comment at the cursor. Comments may span
multiple lines; their contents are ignored when executing a query.

````spl
| makeresults
``` Calculate a rounded value ```
| eval amount=round(3.14159,2)
| table amount
````

In Search, Enter runs the query and Shift+Enter inserts a new line. Put comments
after the first generating command, as shown above. Triple backticks inside
quoted strings remain literal text. Close each comment before running the query.

Syntax coloring does not add support for additional SPL commands or functions to
the simulator.

Reference: [Splunk Enterprise 9.4 comment syntax](https://help.splunk.com/en/splunk-enterprise/search/search-manual/9.4/using-the-search-app/add-comments-to-searches).
