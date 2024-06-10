# Pop CMS

A configurable CMS inspired by [Decap CMS](https://github.com/decaporg/decap-cms) and [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

## Features

- Editor Widgets
  - Boolean
  - DateTime
  - Text
  - Markdown
  - Hidden
- Configurable Editor Preview layout templates
- Configurable Editor Preview styles
- Optional hooks into editor actions
- Local filesystem backend
- Specify a custom backend

> [!NOTE]
> Certain filesystem interactions may perform slowly on Firefox.
> For maximum compatibility, use a Chrome-based browser. 

## Getting Started

### Installing

```bash
TODO: add install command
```

### Import the CMS into your project

- Create a path in your project where you want the CMS to be accessed.\
  ex. `[my-site]/cms`
  - Create a javascript module and import the CMS css and js.
  - Create an html file that loads the module and contains an element with an id of `app`.
- Create a path named `cms-config` in your project **at the same level** as the previously created `cms` path.\
  ex. `[my-site]/cms-config`
  - Add a `config.yml` and any relevant css, html template, and js files.

### Structure

An example of a basic project with the expected structure would look something like this:

```
index.html
cms/                        // The path to access the CMS. (Path name can be anything)
 |-- index.html             // Page that loads 'cms.js'
 |-- pop.js                 // JS module that imports the CMS. (File name can be anything)
cms-config/                 // The path containing CMS config files. (Must be named 'cms-config')
 |-- config.yml             // CMS config file
 |-- preview-template.html  // Layout template to apply to page previews in the editor
 |-- preview-styles.css     // Styles to apply to page previews in the editor
 |-- cms-actions.js         // Additional behavior to hook into editor actions. (Optional)
```

#### cms/index.html

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- The module that loads the CMS -->
    <script type="module" src="pop.js"></script>
  </head>
  <body>
    <!-- The root element used to load the CMS -->
    <slot id="app"></slot>
  </body>
</html>
```

#### cms/pop.js

```js
// Import the CMS css and js
import 'pop-cms/dist/index.css';
import 'pop-cms/dist/index';
```

#### cms-config/

See [dev-site/cms-config](/dev-site/cms-config) for example config files.

## Development

### Install necessary packages:

```bash
npm install
```

### Run the dev server:

```bash
npm run dev
```

Then navigate to `http://localhost:5173/` in your browser to view the dev site.

### Build output files:

```bash
npm run build
```

Built files will be output to the `dist/` directory.

### Structure

#### cms/

Contains the source files to build the CMS.

#### dev-site/

Contains files for running the development server.
