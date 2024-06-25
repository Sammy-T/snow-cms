# Snow CMS

A configurable CMS built with [Svelte](https://svelte.dev/) and inspired by [Decap CMS](https://github.com/decaporg/decap-cms) and [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

I created this project because I wanted a CMS with a rich-text markdown widget, more intuitive custom preview configuration, and a configurable backend.

![snow_screens_01](https://github.com/Sammy-T/snow-cms/assets/22360092/ae6b67ec-3e63-456c-a461-fb6da55d35e0)
![snow_screens_02](https://github.com/Sammy-T/snow-cms/assets/22360092/b2f1bf6e-86b0-4580-8f06-5e426538eeef)

## Features

- Editor Widgets
  - Boolean
  - Number
  - DateTime
  - Text
  - Markdown
  - Hidden
- Editor Preview layout templates (Using html templates with replacement tags)
- Editor Preview styles
- CMS Backends
  - Local filesystem backend (Changes can be manually committed via your external Git CLI/GUI.)
  - GitHub backend
  - Specify your own custom backend
- Optional hooks into editor actions
- Output Markdown files with YAML front matter

> [!NOTE]
> When using the local backend, certain filesystem interactions may perform slowly on Firefox.  
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
  - Create an html file that loads the module and contains a root element with an id of `app`.
- Create a path named `cms-config` in your project **at the same level** as the previously created `cms` path.\
  ex. `[my-site]/cms-config`
  - Add a `config.yml` and any relevant css, html template, and js files.

### Structure

An example of a basic project with the expected structure would look something like this:

```
index.html
cms/                        // The path to access the CMS. (Path name can be anything)
 |-- index.html             // Page that loads 'cms.js'
 |-- snow.js                // JS module that imports the CMS. (File name can be anything)
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
    <script type="module" src="snow.js"></script>
  </head>
  <body>
    <!-- The root element used to load the CMS -->
    <slot id="app"></slot>
  </body>
</html>
```

#### cms/snow.js

```js
// Import the CMS css and js
import 'snow-cms/dist/index.css';
import 'snow-cms/dist/index';
```

#### cms-config/

See [Config](#config) for information on configuration as well as [dev-site/cms-config](/dev-site/cms-config) for example config files.

## Development

### Install [pnpm](https://pnpm.io/)

```bash
npm install -g pnpm
```

### Install necessary packages

```bash
pnpm install
```

### Run the dev server

```bash
pnpm run dev
```

Then navigate to `http://localhost:5173/` in your browser to view the dev site.

### Build output files

```bash
pnpm run build
```

Built files will be output to the `dist/` directory.

### Structure

#### cms/

Contains the source files to build the CMS.

#### dev-site/

Contains files for running the development server.

*Development server site's photos by [Pixabay](https://www.pexels.com/photo/scenic-view-of-rice-paddy-247599/) and [Simon Berger](https://www.pexels.com/photo/silhouette-of-mountains-1323550/) from Pexels.*

## Config

See [dev-site/cms-config](/dev-site/cms-config) for example config files.

> [!NOTE]
> The GitHub backend requires a [GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) to authenticate through and a server-side handler to exchange the access token. 
> 
> The GitHub app should be configured with `Callback URL` and `Setup URL` set to the url of the CMS.
>
> The server-side handler should exchange the received auth code for a user access token. Using one of the [Oauth App middlewares](https://github.com/octokit/oauth-app.js#middlewares) makes this easy to set up.

### Widgets

Widgets share the following configuration options:

- `label`: The input label displayed in the editor interface.
- `name`: The name of the input.
- `default`: The input's default value.
- `required`: Whether the input is required. (Defaults to `true`.)

> [!IMPORTANT]
> Each collection must have widgets configured for the names `title`, `date`, `draft`, and `body`.

#### Boolean

- `widget`: `'boolean'`

```yaml
{
  label: 'Draft',
  name: 'draft',
  widget: 'boolean',
  required: false
}
```

> [!NOTE]
> If the Boolean Widget's `required` option is set to `true` or isn't specified, 
> the input's value must be `true` for editor data to submit.

#### Number

- `widget`: `'number'`
- `step`: The amount the value increments / decrements by. (Defaults to `1`.)
- `min`: The minimum value allowed.
- `max`: The maximum value allowed.

```yaml
{
  label: 'Cookies',
  name: 'cookies',
  widget: 'number',
  step: 5
}
```

#### DateTime

- `widget`: `'datetime'`
- `type`: `'datetime-local|date|time'` Which input to display.
- `datetime_format`: How the datetime should be displayed.
- `date_format`: How the date should be displayed.
- `time_format`: How the time should be displayed.

```yaml
{
  label: 'Publish Date',
  name: 'date',
  widget: 'datetime',
  type: 'datetime-local',
  datetime_format: 'MM.DD.YYYY HH:mm'
}
```

> [!NOTE]
> The corresponding `format` option should be set depending on the `type`.

#### Text

- `widget`: `'string|text'` Which input to display. Use `string` for single-line or `text` for multiline.

```yaml
{
  label: 'Title',
  name: 'title',
  widget: 'string'
}
```

#### Markdown

- `widget`: `'markdown'`

```yaml
{
  label: 'Body',
  name: 'body',
  widget: 'markdown'
}
```

#### Hidden

- `widget`: `'hidden'`
- `type`: `'boolean|number|text|datetime-local|date|time'` The type of the input's value.
- `default`: The value of the hidden input.

```yaml
{
  name: 'hiddenValue',
  widget: 'hidden',
  type: 'text',
  default: 'secret box'
}
```
