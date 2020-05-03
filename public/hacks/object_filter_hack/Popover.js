import _ from 'lodash';
import tippy, { hideAll } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import '../../common/jquery-plugins/observer';

const DEFAULT_PROPS = {
  content: 'LOADING',
  placement: 'right',
  trigger: 'click',
  appendTo: document.body,
  interactive: true,
  allowHTML: true,
  popperOptions: {
    strategy: 'fixed',
  },
  theme: 'light',
};

class Popover {
  constructor(defaultProps = {}) {
    this._defaultProps = {
      ...DEFAULT_PROPS,
      ...defaultProps,
    };
    this._popovers = [];
    this._selected = null;
    this._observers = [];
    this._callback = () => {};
    this._entryValues = [];

    tippy.setDefaultProps(this._defaultProps);
    $('body').on('submit', '.object-filter-form', this.processForm.bind(this));
  }

  processForm(e) {
    e.preventDefault();
    e.stopPropagation();

    const formFields = $('.object-filter-form').serializeArray();
    const selectedEntryValues = [];

    for (let formField of formFields) {
      const entryValue = this._entryValues.find(entryValue => entryValue.value === formField.value);
      selectedEntryValues.push({...entryValue})
    }

    this._selected.hide();
    this._callback(selectedEntryValues);
  }

  observe(target, parentSelector, childSelector) {
    const observer = $(target).observe(
      parentSelector,
      _.throttle(() => {
        const elements = document.querySelectorAll(childSelector);
        this.add(elements);
      }, 2000)
    );
    this._observers.push(observer);
  }

  add(element) {
    const self = this;
    if (!element.isPopoverAdded) {
      element.isPopoverAdded = true;
      const popover = tippy(element, {
        onTrigger(instance, _event) {
          self._selected = instance;
        },
      });
      this._popovers.push(popover);
    }
  }

  formBuilder() {
    const formFields = this._entryValues.map(({ type, path, value, label }) => {
      switch (type) {
        case 'text':
          const lbl = label ? `<strong>${label}: </strong>` : '';
          return `
              <input checked type="checkbox" id="${path}" name="${path}" value="${value}">
              <label for="${path}">${lbl}${value}</label>
            `;
        default:
          return null;
      }
    });

    return `
      <form class="object-filter-form">
        ${formFields.join('<br/>')}
        <br/>
        <input type="submit" value="Set Filters">
      </form>`;
  }

  setForm(entryValues, callback) {
    this._entryValues = entryValues;
    this._callback = callback;
    const formhtml = this.formBuilder();
    this.setContent(formhtml);
  }

  setContent(content) {
    setTimeout(() => {
      if (this._selected) {
        this._selected.setContent(content);
      }
    }, 0);
  }

  hide() {
    if (this._selected) {
      this._selected.hide();
    }
  }

  isInit() {
    return this._popovers.length > 0;
  }

  destroy() {
    this._callback = null;
    this._selected = null;
    for (let popover of this._popovers) {
      popover.unmount();
      popover.destroy();
    }
    this._popovers.length = 0;
    for (let oberver of this._observers) {
      oberver.disconnect();
    }
    this._observers.length = 0;
    this._entryValues.length = 0;
    $('body').off('submit', '.object-filter-form', this.processForm.bind(this));
  }
}

export default Popover;
