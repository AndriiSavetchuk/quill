import extend from 'extend';
import Emitter from '../core/emitter';
import BaseTheme, { BaseTooltip } from './base';
import HighlightTooltipBlot from '../formats/highlightTooltip';
import LinkBlot from '../formats/link';
import { Range } from '../core/selection';
import icons from '../ui/icons';

const TOOLBAR_CONFIG = [
  [{ header: ['1', '2', '3', false] }],
  ['bold', 'italic', 'underline', 'link', 'highlightTooltip'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],
];

class SnowTooltip extends BaseTooltip {
  constructor(quill, bounds) {
    super(quill, bounds);
    this.preview = this.root.querySelector('a.ql-preview');
    this.previewSpan = this.root.querySelector('span.ql-preview');
  }

  listen() {
    super.listen();
    this.root.querySelector('a.ql-action').addEventListener('click', event => {
      if (this.root.classList.contains('ql-editing')) {
        this.save();
      } else if (this.root.classList.contains('ql-preview-span')) {
        this.edit('highlightTooltip', this.previewSpan.textContent);
      } else {
        this.edit('link', this.preview.textContent);
      }
      event.preventDefault();
    });
    this.root.querySelector('a.ql-remove').addEventListener('click', event => {
      if (this.linkRange != null) {
        const range = this.linkRange;
        this.restoreFocus();
        this.quill.formatText(range, 'link', false, Emitter.sources.USER);
        this.quill.formatText(
          range,
          'highlightTooltip',
          false,
          Emitter.sources.USER,
        );
        delete this.linkRange;
      }
      event.preventDefault();
      this.hide();
    });
    this.quill.on(
      Emitter.events.SELECTION_CHANGE,
      (range, oldRange, source) => {
        if (range == null) return;
        if (range.length === 0 && source === Emitter.sources.USER) {
          const [link, offset] = this.quill.scroll.descendant(
            LinkBlot,
            range.index,
          );
          // eslint-disable-next-line
          console.log('import HighlightTooltipBlot', HighlightTooltipBlot);
          console.log('import LinkBlot', LinkBlot);
          const [highlightTooltip, hOffset] = this.quill.scroll.descendant(
            HighlightTooltipBlot,
            range.index,
          );
          console.log('highlightTooltip', highlightTooltip);
          console.log('link', link);
          console.log('======');
          // eslint-disable-next-line
          console.log(this.quill.scroll.descendant(HighlightTooltipBlot, range.index));
          if (link != null) {
            this.linkRange = new Range(range.index - offset, link.length());
            const preview = LinkBlot.formats(link.domNode);
            this.previewSpan.textContent = '';
            this.preview.textContent = preview;
            this.preview.setAttribute('href', preview);
            this.show();
            this.position(this.quill.getBounds(this.linkRange));
            return;
          }
          if (highlightTooltip != null) {
            this.linkRange = new Range(
              range.index - hOffset,
              highlightTooltip.length(),
            );
            const preview = HighlightTooltipBlot.formats(
              highlightTooltip.domNode,
            );
            this.preview.textContent = '';
            this.previewSpan.textContent = preview;
            this.previewSpan.setAttribute('data-tooltip', preview);
            this.show(false);
            this.position(this.quill.getBounds(this.linkRange));
            return;
          }
        } else {
          delete this.linkRange;
        }
        this.hide();
      },
    );
  }

  show(isLink = true) {
    super.show(isLink);
    this.root.removeAttribute('data-mode');
  }
}
SnowTooltip.TEMPLATE = [
  '<span class="ql-preview"></span>',
  '<a class="ql-preview" rel="noopener noreferrer" target="_blank" href="about:blank"></a>',
  '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">',
  '<a class="ql-action"></a>',
  '<a class="ql-remove"></a>',
].join('');

class SnowTheme extends BaseTheme {
  constructor(quill, options) {
    if (
      options.modules.toolbar != null &&
      options.modules.toolbar.container == null
    ) {
      options.modules.toolbar.container = TOOLBAR_CONFIG;
    }
    super(quill, options);
    this.quill.container.classList.add('ql-snow');
  }

  extendToolbar(toolbar) {
    toolbar.container.classList.add('ql-snow');
    this.buildButtons(toolbar.container.querySelectorAll('button'), icons);
    this.buildPickers(toolbar.container.querySelectorAll('select'), icons);
    this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
    if (toolbar.container.querySelector('.ql-link')) {
      this.quill.keyboard.addBinding(
        { key: 'k', shortKey: true },
        (range, context) => {
          toolbar.handlers.link.call(toolbar, !context.format.link);
        },
      );
    }
    if (toolbar.container.querySelector('.ql-highlightTooltip')) {
      this.quill.keyboard.addBinding(
        { key: 'k', shortKey: true },
        (range, context) => {
          toolbar.handlers.highlightTooltip.call(
            toolbar,
            !context.format.highlightTooltip,
          );
        },
      );
    }
  }
}
SnowTheme.DEFAULTS = extend(true, {}, BaseTheme.DEFAULTS, {
  modules: {
    toolbar: {
      handlers: {
        link(value) {
          if (value) {
            const range = this.quill.getSelection();
            if (range == null || range.length === 0) return;
            let preview = this.quill.getText(range);
            if (
              /^\S+@\S+\.\S+$/.test(preview) &&
              preview.indexOf('mailto:') !== 0
            ) {
              preview = `mailto:${preview}`;
            }
            const { tooltip } = this.quill.theme;
            tooltip.edit('link', preview);
          } else {
            this.quill.format('link', false);
          }
        },
        highlightTooltip(value) {
          if (value) {
            const range = this.quill.getSelection();
            if (range == null || range.length === 0) return;
            const preview = this.quill.getText(range);
            const { tooltip } = this.quill.theme;
            tooltip.edit('highlightTooltip', preview);
          } else {
            this.quill.format('highlightTooltip', false);
          }
        },
      },
    },
  },
});

export default SnowTheme;
