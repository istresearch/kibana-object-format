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
    this._currentFilters = [];

    tippy.setDefaultProps(this._defaultProps);
    $('body').on('submit', '.object-filter-form', this.processForm.bind(this));
  }

  processForm(e) {
    e.preventDefault();
    e.stopPropagation();

    const formFields = $('.object-filter-form').serializeArray();

    const selectedEntryValues =  this._entryValues.map(entryValue => ({
      ...entryValue,
      checked: formFields.findIndex(field => field.value === entryValue.value) !== -1,
    }))

    this._selected.hide();
    this._callback(selectedEntryValues);
  }

  observe(target, parentSelector, childSelector) {
    const observer = $(target).observe(
      parentSelector,
      _.throttle(() => {
        console.log('observe')
        const elements = document.querySelectorAll(childSelector);
        if (elements.length > 0) {
          for (let element of elements) {
            this.add(element);
          }
        }
      }, 100)
    );
    this._observers.push(observer);
  }

  add(element) {
    const self = this;
    if (!element.isPopoverAdded) {
      element.isPopoverAdded = true;
      const popover = tippy(element, {
        onTrigger(instance, event) {
          self._selected = instance;
          $(event.target).addClass('keep-icon-visible');
        },
        onHide(_instance) {
          console.log('hide')
          self._selected = null;
          $('.keep-icon-visible').removeClass('keep-icon-visible');
        },
      });
      this._popovers.push(popover);
    }
  }

  formBuilder() {
    const formFields = this._entryValues.map(({ type, path, value, label }) => {
    let filterExist = this._currentFilters.findIndex(filter => filter.key === path && filter.value === value) !== -1;

      switch (type) {
        case 'text':
          const lbl = label ? `<strong>${label}: </strong>` : '';
          return `
            <label class="po-checkbox">
              <span>${lbl}${value}</span>
              <input type="checkbox" ${filterExist && 'checked'} id="${path}" name="${path}" value="${value}">
              <span class="checkmark"></span>
            </label>
            `;
        default:
          return null;
      }
    });

    return `
      <form class="object-filter-form">
        <div class="object-filter-form-body"> 
          ${formFields.join('')}
        </div>
        <div class="object-filter-form-footer"> 
          <button class="euiButton euiButton--primary euiButton--fill euiButton--small" type="submit">
            <span class="euiButton__content">
              <span class="euiButton__text">Set Filters</span>
            </span>
          </button>
        </div>
      </form>`;
  }
 
  setForm(entryValues, currentFilters, callback) {
    this._entryValues = entryValues;
    this._currentFilters = currentFilters;
    this._callback = callback;
    const formhtml = this.formBuilder();
    this.setContent(formhtml);
  }

  setContent(content) {
    setTimeout(() => {
      if (this._selected) {
        this._selected.setContent('');
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
    for (let oberver of this._observers) {
      oberver.disconnect();
    }
    this._popovers.length = 0;
    this._observers.length = 0;
    this._entryValues.length = 0;
    this._currentFilters.length = 0;
    $('body').off('submit', '.object-filter-form', this.processForm.bind(this));
  }
}

export default Popover;
