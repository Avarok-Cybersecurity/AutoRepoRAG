# API reference

## render(widget, options)

Renders a widget into a container element. `options.theme` selects the
colour scheme.

## destroy(widget)

Removes a widget and frees its listeners.

### Errors

`destroy` throws `WidgetGoneError` when the widget was already removed.
