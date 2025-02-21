# Pink Marker JS

Pink Marker JS is a TypeScript library that allows annotations in the DOM to be created, saved, and restored. It uses `TreeWalker` to track and serialize text selections, ensuring that annotations persist even after a page reload.

## Features

- Highlight text selections with overlays
- Save notes for marked text
- Restore highlights and notes
- Minimal implementation with no external dependencies
- Customizable overlays and modals

## Installation

Pink Marker can be integrated into a project via npm:

```sh
npm install pink-marker
```

Alternatively, it can be included directly via a `<script>` tag:

```html
<script src="./dist/pink-marker.min.js"></script>
```

## Usage

### HTML Integration

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pink Marker Example</title>
    <script src="./dist/pink-marker.min.js"></script>
  </head>
  <body>
    <div class="container">
      <h1>Text with Annotations</h1>
      <p>Select this text to add a note.</p>
    </div>
    <script>
      const pinkMarker = new PinkMarker({
        overlayColor: 'rgba(255,105,180,0.5)',
        saveButtonText: 'Save',
        cancelButtonText: 'Cancel',
        deleteButtonText: 'Delete',
        defaultIcon: './icon.svg',
      });
      pinkMarker.init();
    </script>
  </body>
</html>
```

### API

#### `new PinkMarker(options: PinkMarkerOptions)`

Creates a new instance of the library.

**Options:**
| Name | Type | Description |
|-----------------------------|--------|-------------|
| `modalClass` | string | CSS class for the modal window |
| `modalTextareaClass` | string | CSS class for the textarea |
| `modalButtonContainerClass` | string | CSS class for the button container |
| `saveButtonClass` | string | CSS class for the save button |
| `cancelButtonClass` | string | CSS class for the cancel button |
| `deleteButtonClass` | string | CSS class for the delete button |
| `saveButtonText` | string | Text for the save button |
| `cancelButtonText` | string | Text for the cancel button |
| `deleteButtonText` | string | Text for the delete button |
| `overlayColor` | string | Color of the highlight overlay |
| `iconClass` | string | CSS class for the icon |
| `iconContainerClass` | string | CSS class for the icon container |
| `iconContainerTitle` | string | Tooltip text for the icon |
| `defaultIcon` | string | Default icon |

#### `init()`

Initializes the highlighting logic and adds the necessary event listeners.

## Development

The library is developed in TypeScript and compiled into a minified JavaScript file.

### Build Process

To build the library, run:

```sh
npm run build
```

This compiles the TypeScript code and minifies the output using `terser`.

## License

MIT License
